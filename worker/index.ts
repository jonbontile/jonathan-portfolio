/**
 * Worker entry point.
 *
 * Static pages in ./dist are served directly by Workers static assets. Because
 * `run_worker_first` is limited to `/api/*`, this code runs only for API requests.
 *
 * Phase 1: the contact endpoint is a stub that reports it is not yet available.
 * Phase 5 implements validation, rate limiting, Turnstile and Resend delivery
 * (docs/decisions/SECURITY_AND_PRIVACY.md).
 */

export interface Env {
  ASSETS: Fetcher;
}

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

function json(body: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...jsonHeaders, ...extra } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact' || url.pathname === '/api/contact/') {
      if (request.method !== 'POST') {
        return json({ ok: false, error: 'method_not_allowed' }, 405, { allow: 'POST' });
      }
      return json({ ok: false, error: 'not_available_yet' }, 503);
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ ok: false, error: 'not_found' }, 404);
    }

    // Anything else that reaches the Worker falls back to the static assets.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
