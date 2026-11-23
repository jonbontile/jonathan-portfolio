// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readdir, readFile } from 'node:fs/promises';
import { readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isStrictBuild, includePreviewPages, buildModeLabel, usingTurnstileTestKey } from './src/lib/build-mode.mjs';

// The canonical site URL is set only once the production domain is approved
// (CONTENT_STRATEGY.md: canonical/social metadata only after domain verification).
// Until then SITE_URL is unset, so no canonical URLs or sitemap are generated.
const site = process.env.SITE_URL || undefined;

/**
 * Staged pages: real site pages whose content isn't approved yet. Each .astro
 * file in src/staged/ is injected at the URL its path implies (about.astro ->
 * /about, case-studies/[slug].astro -> /case-studies/[slug]) in PREVIEW builds
 * only. To publish a page once its content is approved, move it to src/pages/.
 */
function stagedRoutes(dir = 'src/staged', prefix = '') {
  /** @type {{ pattern: string, entrypoint: string }[]} */
  const routes = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_')) continue;
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      routes.push(...stagedRoutes(path, `${prefix}/${entry.name}`));
    } else if (entry.name.endsWith('.astro')) {
      const name = entry.name.replace(/\.astro$/, '');
      routes.push({ pattern: name === 'index' ? prefix || '/' : `${prefix}/${name}`, entrypoint: `./${path}` });
    }
  }
  return routes;
}

/** Preview-only review and staged pages. Never part of a strict (production) build. */
/** @type {import('astro').AstroIntegration} */
const previewPages = {
  name: 'preview-pages',
  hooks: {
    'astro:config:setup': ({ injectRoute, logger }) => {
      logger.info(`build mode: ${buildModeLabel}; preview pages ${includePreviewPages ? 'included' : 'excluded'}`);
      if (includePreviewPages) {
        injectRoute({ pattern: '/design-system', entrypoint: './src/review/design-system.astro' });
        injectRoute({ pattern: '/content-status', entrypoint: './src/review/content-status.astro' });
        injectRoute({ pattern: '/prototype', entrypoint: './src/review/homepage-prototype.astro' });
        for (const route of stagedRoutes()) injectRoute(route);
      }
    },
  },
};

/**
 * Final safety net for strict builds: fail if any built page still contains an
 * "[INFORMATION NEEDED" placeholder. Content-level checks happen earlier in
 * src/lib/content.ts (drafts dropped, unapproved claims refused).
 */
const PLACEHOLDER = '[INFORMATION NEEDED';

/** @param {string} dir @returns {AsyncGenerator<string>} */
async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith('.html')) yield path;
  }
}

/** @type {import('astro').AstroIntegration} */
const publicationGuard = {
  name: 'publication-guard',
  hooks: {
    'astro:config:setup': () => {
      // A published contact page must use a real Turnstile site key.
      if (isStrictBuild && existsSync('src/pages/contact.astro') && usingTurnstileTestKey) {
        throw new Error(
          'Production build refused: the contact page is published but PUBLIC_TURNSTILE_SITE_KEY is unset (test key in use).',
        );
      }
    },
    'astro:build:done': async ({ dir, logger }) => {
      if (!isStrictBuild) {
        logger.info('lenient build: placeholders allowed');
        return;
      }
      const root = fileURLToPath(dir);
      const offenders = [];
      for await (const file of htmlFiles(root)) {
        if ((await readFile(file, 'utf8')).includes(PLACEHOLDER)) offenders.push(relative(root, file));
      }
      if (offenders.length > 0) {
        throw new Error(
          `Production build refused: ${offenders.length} page(s) still contain "${PLACEHOLDER}":\n  ${offenders.join('\n  ')}`,
        );
      }
      logger.info('strict build: no placeholders found');
    },
  },
};

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx(), previewPages, publicationGuard, ...(site ? [sitemap()] : [])],
  vite: {
    plugins: [tailwindcss()],
    // Never inline small assets: inline scripts and data: fonts are blocked by the
    // site's Content-Security-Policy (script-src 'self', no data: fonts).
    build: { assetsInlineLimit: 0 },
  },
});
