# Jonathan Bontile, CPA: Professional Portfolio

A static Astro site served by a Cloudflare Worker with static assets. The same Worker handles one API route for the contact form.

**Status:** Phase 1 (repository and pipeline). Pre-launch: every page is `noindex`, and there is no custom domain yet.

## Stack

- Astro 7 (static output), TypeScript (strict), Tailwind CSS 4, MDX
- Cloudflare Workers with static assets (`wrangler.jsonc`), with the Worker code in `worker/`
- Node.js 26 (`.node-version`), npm 11

## Deployment

Cloudflare Workers Builds is connected to this repository.

- A merge to `main` builds with `npm run build` and deploys with `npx wrangler deploy` to the production Worker (`*.workers.dev` until launch).
- Every other branch gets a preview build with its own preview URL.
- `main` is protected, so all changes go through a pull request. Review the preview before merging.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Astro dev server (pages only) |
| `npm run build` | Build the static site to `dist/` |
| `npm run preview` | Build, then run the Worker and assets locally with Wrangler |
| `npm run check` | Type-check the Astro site and the Worker |
| `npm run deploy` | Build and deploy with Wrangler. **Production deploys need approval.** Normally Workers Builds deploys from `main` |

## Content and publishing

Content lives in Markdown under `src/content/` (profile, services, experience, qualifications, skills, case studies, testimonials, articles). The typed schemas are in `src/content.config.ts`.

- Every entry has `status: draft | approved` and `claimIds`. Each claim ID refers to a row in the private evidence registers.
- `src/data/approved-claims.json` lists the claim IDs approved for publication. It holds IDs only, never evidence.
- **Production builds** (`main` on Cloudflare, or `PRODUCTION_BUILD=1`) publish approved entries only. They **fail** if approved content cites an unapproved claim, if a required field is missing, or if any page still contains `[INFORMATION NEEDED`.
- **Local and preview builds** include drafts. Review pages: `/content-status/` (what's blocking publication) and `/design-system/`.
- Copy `src/content/case-studies/_TEMPLATE.md` to start a case study. Files starting with `_` are never built.

### Staged pages

Site pages whose content isn't approved yet live in `src/staged/`. They are built at their real URLs (`/about/`, `/case-studies/[slug]/` and so on) in **preview builds only**. To publish a page once its content is approved, move it into `src/pages/`. The production guard still refuses it if anything is missing. The homepage prototype is at `/prototype/` on previews.

## Project documents

- Repository root: the owner's planning documents (`CLAUDE.md`, `PROJECT_BRIEF.md`, `CLAUDE_CODE_IMPLEMENTATION_PLAN.md`, `CONTENT_STRATEGY.md`, `DESIGN_SYSTEM.md`, `VISUAL_DESIGN_BRIEF.md`, `CLAUDE_CODE_DESIGN_IMPLEMENTATION.md`) and `Claude Code Master Prompt.md`.
- Decision records, audits and the evidence registers live in a **separate private repository**, checked out locally at `docs/`. This public repository ignores that folder.

## Rules

Never commit secrets (`.dev.vars`, `.env*`) or client evidence. No DNS, production or custom-domain changes without approval. See `CLAUDE.md`.
