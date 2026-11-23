// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// The canonical site URL is set only once the production domain is approved
// (CONTENT_STRATEGY.md: canonical/social metadata only after domain verification).
// Until then SITE_URL is unset, so no canonical URLs or sitemap are generated.
const site = process.env.SITE_URL || undefined;

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx(), ...(site ? [sitemap()] : [])],
  vite: {
    plugins: [tailwindcss()],
  },
});
