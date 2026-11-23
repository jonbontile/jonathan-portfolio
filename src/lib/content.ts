/**
 * The only way pages should read content.
 *
 * getPublished(collection):
 *   - lenient builds (local, preview): every entry, drafts included
 *   - strict builds (production): approved entries only, and the build FAILS
 *     if an approved entry cites a claim that isn't in approved-claims.json
 */
import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import { isStrictBuild } from './build-mode.mjs';
import approvedClaims from '../data/approved-claims.json';

const approved = new Set<string>(approvedClaims.approved);

export class UnapprovedClaimError extends Error {}

export function unapprovedClaims(entry: { data: { claimIds?: string[] } }): string[] {
  return (entry.data.claimIds ?? []).filter((id) => !approved.has(id));
}

export async function getPublished<C extends CollectionKey>(collection: C): Promise<CollectionEntry<C>[]> {
  const entries = (await getCollection(collection)) as CollectionEntry<C>[];
  if (!isStrictBuild) return entries;

  const published = entries.filter((e) => (e.data as { status: string }).status === 'approved');
  const problems = published
    .map((e) => ({ id: `${collection}/${e.id}`, missing: unapprovedClaims(e as never) }))
    .filter((p) => p.missing.length > 0);

  if (problems.length > 0) {
    const detail = problems.map((p) => `  ${p.id}: ${p.missing.join(', ')}`).join('\n');
    throw new UnapprovedClaimError(
      `Production build refused: approved content cites claims not in src/data/approved-claims.json:\n${detail}`,
    );
  }
  return published;
}

export const isDraft = (entry: { data: { status: string } }) => entry.data.status !== 'approved';

const ALL_COLLECTIONS: CollectionKey[] = [
  'profile',
  'services',
  'experience',
  'qualifications',
  'skills',
  'caseStudies',
  'testimonials',
  'articles',
];
const PLACEHOLDER = '[INFORMATION NEEDED';

let validation: Promise<void> | undefined;

/**
 * Validate ALL content once per strict build, whether or not a page displays it.
 * Approved entries must cite only approved claims and contain no placeholders.
 * Called from BaseLayout, so every production build runs it.
 */
export function assertPublishableContent(): Promise<void> {
  if (!isStrictBuild) return Promise.resolve();
  validation ??= (async () => {
    const problems: string[] = [];
    for (const key of ALL_COLLECTIONS) {
      for (const e of await getCollection(key)) {
        const data = e.data as { status: string; claimIds?: string[] };
        if (data.status !== 'approved') continue;
        const missing = unapprovedClaims(e as never);
        if (missing.length) problems.push(`  ${key}/${e.id}: unapproved claims ${missing.join(', ')}`);
        const text = JSON.stringify(e.data) + (('body' in e && e.body) || '');
        if (text.includes(PLACEHOLDER)) problems.push(`  ${key}/${e.id}: still contains "${PLACEHOLDER}"`);
      }
    }
    if (problems.length) {
      throw new UnapprovedClaimError(`Production build refused: approved content is not publishable:\n${problems.join('\n')}`);
    }
  })();
  return validation;
}
