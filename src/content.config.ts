/**
 * Content collections: Markdown is the source of truth (CONTENT_STRATEGY.md).
 *
 * Every entry carries:
 *   status    draft | approved. Only `approved` entries publish in production.
 *   claimIds  register IDs (e.g. "ID-01", "CS-01-C2") for every factual claim
 *             the entry makes. Production builds fail if an approved entry cites
 *             an ID missing from src/data/approved-claims.json.
 *
 * Files whose names start with "_" are ignored (use them for notes/templates).
 */
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const md = (base: string) => glob({ pattern: '**/[^_]*.{md,mdx}', base: `./src/content/${base}` });

/** Fields shared by every collection. */
const governance = {
  status: z.enum(['draft', 'approved']).default('draft'),
  claimIds: z.array(z.string().regex(/^[A-Z]{2}-\d{2}(-C\d+)?$/, 'Use register IDs like ID-01 or CS-01-C2')).default([]),
};

const engagementType = z.enum(['employment', 'freelance', 'business-ownership', 'independent']);
const yearMonth = z.string().regex(/^\d{4}(-\d{2})?$/, 'Use YYYY or YYYY-MM');

/**
 * Drafts may leave unknown facts empty rather than guess them. Approved
 * entries must fill every field listed here.
 */
const requiredWhenApproved =
  (fields: string[]) =>
  (data: Record<string, unknown>, ctx: z.RefinementCtx) => {
    if (data.status !== 'approved') return;
    for (const field of fields) {
      if (data[field] === undefined || data[field] === '') {
        ctx.addIssue({ code: 'custom', path: [field], message: `\`${field}\` is required before an entry can be approved` });
      }
    }
  };

const profile = defineCollection({
  loader: md('profile'),
  schema: z.object({
    ...governance,
    name: z.string(),
    credential: z.string().optional(),
    headline: z.string(),
    summary: z.string(),
    location: z.string().optional(),
    languages: z.array(z.string()).default([]),
    availability: z.string().optional(),
    /** Short facts for the homepage overview table. */
    focus: z.string().optional(),
    experience: z.string().optional(),
    worksWith: z.string().optional(),
    resumePdf: z.string().optional(),
    portfolioPdf: z.string().optional(),
  }),
});

const services = defineCollection({
  loader: md('services'),
  schema: z.object({
    ...governance,
    title: z.string(),
    audience: z.enum(['clients', 'employers', 'both']),
    summary: z.string(),
    deliverables: z.array(z.string()).default([]),
    boundaries: z.array(z.string()).default([]),
    order: z.number().int().default(100),
  }),
});

const experience = defineCollection({
  loader: md('experience'),
  schema: z
    .object({
      ...governance,
      title: z.string(),
      organization: z.string().describe('Name, or an anonymized descriptor if not approved for naming'),
      engagementType: engagementType.optional(),
      start: yearMonth.optional(),
      end: yearMonth.optional(),
      ongoing: z.boolean().default(false),
      location: z.string().optional(),
      summary: z.string(),
      responsibilities: z.array(z.string()).default([]),
    })
    .superRefine(requiredWhenApproved(['engagementType', 'start']))
    .refine((e) => e.status !== 'approved' || e.ongoing !== Boolean(e.end), {
      message: 'Set either `end` or `ongoing: true`, not both or neither',
    }),
});

const qualifications = defineCollection({
  loader: md('qualifications'),
  schema: z.object({
    ...governance,
    name: z.string(),
    kind: z.enum(['license', 'certification', 'degree', 'training']),
    issuer: z.string(),
    year: z.number().int().min(1950).max(2100).optional(),
    showCredentialId: z.boolean().default(false),
    verifyUrl: z.url().optional(),
    order: z.number().int().default(100),
  }),
});

const skills = defineCollection({
  loader: md('skills'),
  schema: z.object({
    ...governance,
    category: z.string(),
    items: z.array(
      z.object({
        name: z.string(),
        evidence: z.string().optional().describe('Case study slug or certification that shows it'),
      }),
    ),
    order: z.number().int().default(100),
  }),
});

const caseStudies = defineCollection({
  loader: md('case-studies'),
  schema: z.object({
    ...governance,
    title: z.string(),
    clientDescriptor: z.string().describe('Never a client name unless named-with-permission'),
    industry: z.string(),
    engagementType: engagementType.optional(),
    progress: z.enum(['ongoing', 'completed']).optional(),
    role: z.string(),
    period: z.string().optional(),
    tools: z.array(z.string()).default([]),
    services: z.array(reference('services')).default([]),
    summary: z.string(),
    outcome: z
      .object({
        text: z.string(),
        source: z.enum(['observed', 'client-reported', 'documented']),
      })
      .optional(),
    publicationPermission: z.enum(['anonymized', 'named-with-permission']).default('anonymized'),
    permissionNote: z.string().optional(),
    containsSyntheticData: z.boolean().default(false),
    featured: z.boolean().default(false),
    order: z.number().int().default(100),
  })
    .superRefine(requiredWhenApproved(['engagementType', 'progress']))
    .refine((c) => c.publicationPermission === 'anonymized' || Boolean(c.permissionNote), {
      message: 'A named client requires a permissionNote',
    }),
});

const testimonials = defineCollection({
  loader: md('testimonials'),
  schema: z.object({
    ...governance,
    quote: z.string(),
    attribution: z.string(),
    relationship: z.string(),
    permissionConfirmed: z.literal(true, { message: 'Testimonials require written permission' }),
  }),
});

const articles = defineCollection({
  loader: md('articles'),
  schema: z.object({
    ...governance,
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { profile, services, experience, qualifications, skills, caseStudies, testimonials, articles };
