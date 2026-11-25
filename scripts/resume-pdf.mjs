/**
 * Prints the resume page to public/downloads/jonathan-bontile-resume.pdf.
 *
 *   npm run build          (a preview build: /resume-print/ is preview-only)
 *   npm run resume:pdf
 *
 * Serves dist/ on a temporary local port, so the PDF matches the built site.
 * Refuses to write the PDF while the page still has placeholders.
 */
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const out = 'public/downloads/jonathan-bontile-resume.pdf';
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png' };

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname).slice(1);
  if (path === '' || path.endsWith('/')) path += 'index.html';
  if (path.includes('..')) return void res.writeHead(400).end();
  try {
    const body = await readFile(join('dist', path));
    res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  const res = await page.goto(`${base}/resume-print/`, { waitUntil: 'networkidle' });
  if (!res?.ok()) throw new Error(`Resume page returned ${res?.status()}. Run a preview build first (npm run build).`);
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.locator('text=/INFORMATION NEEDED/').allInnerTexts();
  if (missing.length) throw new Error(`Resume still has placeholders:\n  ${missing.join('\n  ')}`);
  await mkdir('public/downloads', { recursive: true });
  await page.pdf({ path: out, format: 'Letter', preferCSSPageSize: true, printBackground: true, tagged: true, outline: true });
  console.log(`Wrote ${out}`);
} finally {
  await browser.close();
  server.close();
}
