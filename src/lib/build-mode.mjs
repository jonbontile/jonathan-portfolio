// @ts-check
/**
 * One definition of "production build", shared by astro.config.mjs and pages.
 *
 * Production (strict) when ANY of:
 *   - PRODUCTION_BUILD=1 is set (manual override for local checks)
 *   - running on Cloudflare Workers Builds (WORKERS_CI) on branch `main`
 *   - running on Cloudflare with NO branch reported (fail-safe: be strict)
 *
 * Strict builds publish only approved content, require every cited claim to
 * be approved, and fail if any page still contains "[INFORMATION NEEDED".
 * Local and preview builds are lenient so drafts can be reviewed.
 */

const onCloudflare = Boolean(process.env.WORKERS_CI);
const branch = process.env.WORKERS_CI_BRANCH || undefined;

export const isStrictBuild =
  process.env.PRODUCTION_BUILD === '1' || (onCloudflare && (!branch || branch === 'main'));

/** Preview-only pages (review pages) are included only in lenient builds. */
export const includePreviewPages = !isStrictBuild;

export const buildModeLabel = isStrictBuild
  ? `strict (production${branch ? `, branch ${branch}` : ''})`
  : `lenient (${onCloudflare ? `preview, branch ${branch}` : 'local'})`;
