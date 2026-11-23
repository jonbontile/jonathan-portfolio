/**
 * POST /api/contact
 *
 * Order (cheap checks first), per docs/decisions/SECURITY_AND_PRIVACY.md §2:
 *   1. Origin must be this site            → 403
 *   2. Content type and size (≤ 16 KB)     → 415 / 413
 *   3. Rate limit (binding, per IP)        → 429
 *   4. Honeypot filled                     → generic success, nothing sent
 *   5. Validation (shared rules)           → 400 with field errors
 *   6. Turnstile siteverify                → 403
 *   7. Send via Resend (plain text)        → 502 on provider failure
 *
 * Until RESEND_API_KEY, TURNSTILE_SECRET_KEY and CONTACT_TO are all set, the
 * endpoint answers 503 "not_available_yet": nothing is ever silently dropped.
 *
 * Logging: outcome codes only. Never message content, names, emails, IPs or keys.
 */
import { validateContact, type ContactInput } from '../src/lib/contact-schema';
import { inquiryTypes } from '../src/lib/labels';

export interface ContactEnv {
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
  RESEND_API_URL?: string;
  CONTACT_LIMITER?: RateLimit;
}

const MAX_BODY_BYTES = 16 * 1024;
const TURNSTILE_VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const DEFAULT_RESEND_URL = 'https://api.resend.com/emails';
/** Cloudflare's published always-pass test secret (local development only). */
const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA';

type Outcome =
  | 'sent'
  | 'honeypot'
  | 'invalid'
  | 'forbidden_origin'
  | 'unsupported_type'
  | 'too_large'
  | 'rate_limited'
  | 'turnstile_failed'
  | 'provider_error'
  | 'not_configured';

const baseHeaders = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

function log(outcome: Outcome, extra: Record<string, string | number | undefined> = {}) {
  // Structured, content-free log line for Workers Logs.
  console.log(JSON.stringify({ event: 'contact', outcome, ...extra }));
}

/** JS clients ask for JSON; plain HTML form posts get a redirect to a result page. */
function respond(request: Request, status: number, body: Record<string, unknown>): Response {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  if (wantsJson) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...baseHeaders, 'content-type': 'application/json; charset=utf-8' },
    });
  }
  const target = body.ok ? '/contact/sent/' : `/contact/error/?reason=${encodeURIComponent(String(body.error ?? 'error'))}`;
  return new Response(null, { status: 303, headers: { ...baseHeaders, location: target } });
}

/** Strip control characters (incl. CR/LF) from single-line fields. */
const oneLine = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();

async function readBody(request: Request): Promise<Record<string, string> | 'unsupported' | 'too_large' | 'malformed'> {
  // Keep the original header: the multipart boundary is case-sensitive.
  const rawType = request.headers.get('content-type') ?? '';
  const type = rawType.toLowerCase();
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) return 'too_large';

  const raw = await request.arrayBuffer();
  if (raw.byteLength > MAX_BODY_BYTES) return 'too_large';
  const text = new TextDecoder().decode(raw);

  if (type.startsWith('application/json')) {
    try {
      const data = JSON.parse(text) as Record<string, unknown>;
      return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? v : String(v ?? '')]));
    } catch {
      return {};
    }
  }
  if (type.startsWith('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(text));
  }
  if (type.startsWith('multipart/form-data')) {
    try {
      const form = await new Request('http://local/', { method: 'POST', headers: { 'content-type': rawType }, body: raw }).formData();
      const out: Record<string, string> = {};
      for (const [k, v] of form.entries()) if (typeof v === 'string') out[k] = v;
      return out;
    } catch {
      return 'malformed';
    }
  }
  return 'unsupported';
}

async function verifyTurnstile(token: string, secret: string, ip: string | null, expectedHost: string) {
  const body = new URLSearchParams({ secret, response: token, idempotency_key: crypto.randomUUID() });
  if (ip) body.set('remoteip', ip);
  const res = await fetch(TURNSTILE_VERIFY, { method: 'POST', body, signal: AbortSignal.timeout(8000) });
  const data = (await res.json()) as { success: boolean; hostname?: string; action?: string; 'error-codes'?: string[] };
  const isTest = secret === TURNSTILE_TEST_SECRET;
  const hostOk = isTest || data.hostname === expectedHost;
  const actionOk = isTest || !data.action || data.action === 'contact';
  return { ok: data.success && hostOk && actionOk, codes: (data['error-codes'] ?? []).join(',') || (!hostOk ? 'hostname' : !actionOk ? 'action' : '') };
}

export async function handleContact(request: Request, env: ContactEnv): Promise<Response> {
  const url = new URL(request.url);

  // 1. Same-origin only (CSRF mitigation; see SECURITY_AND_PRIVACY.md §4).
  const origin = request.headers.get('origin');
  if (origin !== url.origin) {
    log('forbidden_origin');
    return respond(request, 403, { ok: false, error: 'forbidden' });
  }

  // 2. Content type and size.
  const fields = await readBody(request);
  if (fields === 'too_large') {
    log('too_large');
    return respond(request, 413, { ok: false, error: 'too_large' });
  }
  if (fields === 'unsupported') {
    log('unsupported_type');
    return respond(request, 415, { ok: false, error: 'unsupported_type' });
  }
  if (fields === 'malformed') {
    log('invalid', { fields: 'body' });
    return respond(request, 400, { ok: false, error: 'invalid' });
  }

  // Not configured yet: be explicit rather than pretend to send.
  if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET_KEY || !env.CONTACT_TO) {
    log('not_configured');
    return respond(request, 503, { ok: false, error: 'not_available_yet' });
  }

  // 3. Rate limit per IP (approximate, per location: a backstop, not a guarantee).
  const ip = request.headers.get('cf-connecting-ip');
  if (env.CONTACT_LIMITER) {
    const { success } = await env.CONTACT_LIMITER.limit({ key: ip ?? 'unknown' });
    if (!success) {
      log('rate_limited');
      return respond(request, 429, { ok: false, error: 'rate_limited' });
    }
  }

  // 4. Honeypot: pretend success so bots learn nothing.
  if ((fields.website ?? '').trim() !== '') {
    log('honeypot');
    return respond(request, 200, { ok: true });
  }

  // 5. Validation with the same rules as the browser form.
  const input: ContactInput = {
    name: oneLine(fields.name ?? ''),
    email: oneLine(fields.email ?? ''),
    inquiryType: oneLine(fields.inquiryType ?? ''),
    company: oneLine(fields.company ?? ''),
    subject: oneLine(fields.subject ?? ''),
    message: (fields.message ?? '').replace(/\r\n?/g, '\n').trim(),
    privacy: fields.privacy === 'yes' || fields.privacy === 'true',
  };
  const errors = validateContact(input);
  if (Object.keys(errors).length > 0) {
    log('invalid', { fields: Object.keys(errors).join(',') });
    return respond(request, 400, { ok: false, error: 'invalid', fields: errors });
  }

  // 6. Turnstile, server side.
  const token = fields['cf-turnstile-response'] ?? '';
  if (!token) {
    log('turnstile_failed', { codes: 'missing-input-response' });
    return respond(request, 403, { ok: false, error: 'verification_failed' });
  }
  try {
    const check = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip, url.hostname);
    if (!check.ok) {
      log('turnstile_failed', { codes: check.codes });
      return respond(request, 403, { ok: false, error: 'verification_failed' });
    }
  } catch {
    log('turnstile_failed', { codes: 'siteverify-unreachable' });
    return respond(request, 503, { ok: false, error: 'verification_unavailable' });
  }

  // 7. Send. Plain text only; visitor input never goes in From/To.
  const typeLabel = inquiryTypes.find((t) => t.value === input.inquiryType)?.label ?? input.inquiryType;
  const subjectLine = oneLine(`[Portfolio] ${typeLabel}: ${input.subject || input.message.slice(0, 60)}`).slice(0, 200);
  const text = [
    'New inquiry from the portfolio contact form.',
    'Content below was entered by a website visitor. Treat links with care.',
    '',
    `Inquiry type: ${typeLabel}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Company: ${input.company || '-'}`,
    `Subject: ${input.subject || '-'}`,
    `Received (UTC): ${new Date().toISOString()}`,
    `Site: ${url.hostname}`,
    '',
    'Message:',
    input.message,
  ].join('\n');

  try {
    const res = await fetch(env.RESEND_API_URL || DEFAULT_RESEND_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM || 'Jonathan Bontile Portfolio <portfolio@notify.bontilebiz.com>',
        to: [env.CONTACT_TO],
        reply_to: input.email,
        subject: subjectLine,
        text,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      log('provider_error', { status: res.status });
      return respond(request, res.status === 429 ? 503 : 502, { ok: false, error: 'send_failed' });
    }
  } catch {
    log('provider_error', { status: 'unreachable' });
    return respond(request, 502, { ok: false, error: 'send_failed' });
  }

  log('sent', { type: input.inquiryType });
  return respond(request, 200, { ok: true });
}
