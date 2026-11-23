// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// The canonical site URL is set only once the production domain is approved
// (CONTENT_STRATEGY.md: canonical/social metadata only after domain verification).
// Until then SITE_URL is unset, so no canonical URLs or sitemap are generated.
const site = process.env.SITE_URL || undefined;

// Preview-only pages (e.g. the design token review page for gate 3).
// Fail-safe: on Cloudflare (WORKERS_CI set) they are included ONLY when the build
// reports a branch other than `main`. If the branch variable is missing, they are
// left out. Local builds always include them.
const onCloudflare = Boolean(process.env.WORKERS_CI);
const branch = process.env.WORKERS_CI_BRANCH;
const includePreviewPages = onCloudflare ? Boolean(branch) && branch !== 'main' : true;

/** @type {import('astro').AstroIntegration} */
const previewPages = {
  name: 'preview-pages',
  hooks: {
    'astro:config:setup': ({ injectRoute, logger }) => {
      logger.info(`preview pages ${includePreviewPages ? 'included' : 'excluded'} (branch: ${branch ?? 'unset'})`);
      if (includePreviewPages) {
        injectRoute({ pattern: '/design-system', entrypoint: './src/review/design-system.astro' });
      }
    },
  },
};

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx(), previewPages, ...(site ? [sitemap()] : [])],
  vite: {
    plugins: [tailwindcss()],
    // Never inline small assets: inline scripts and data: fonts are blocked by the
    // site's Content-Security-Policy (script-src 'self', no data: fonts).
    build: { assetsInlineLimit: 0 },
  },
});
