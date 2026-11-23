# Jonathan Bontile, CPA: Professional Portfolio

A static Astro site served by a Cloudflare Worker with static assets. The same Worker handles one API route for the contact form.

**Status:** Phase 1 (repository and pipeline). Pre-launch: every page is `noindex`, and there is no custom domain yet.

## Stack

- Astro 7 (static output), TypeScript (strict), Tailwind CSS 4, MDX
- Cloudflare Workers with static assets (`wrangler.jsonc`), with the Worker code in `worker/`
- Node.js 26 (`.node-version`), npm 11

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Astro dev server (pages only) |
| `npm run build` | Build the static site to `dist/` |
| `npm run preview` | Build, then run the Worker and assets locally with Wrangler |
| `npm run check` | Type-check the Astro site and the Worker |
| `npm run deploy` | Build and deploy with Wrangler. **Production deploys need approval.** Normally Workers Builds deploys from `main` |

## Project documents

- Repository root: the owner's planning documents (`CLAUDE.md`, `PROJECT_BRIEF.md`, `CLAUDE_CODE_IMPLEMENTATION_PLAN.md`, `CONTENT_STRATEGY.md`, `DESIGN_SYSTEM.md`, `VISUAL_DESIGN_BRIEF.md`, `CLAUDE_CODE_DESIGN_IMPLEMENTATION.md`) and `Claude Code Master Prompt.md`.
- Decision records, audits and the evidence registers live in a **separate private repository**, checked out locally at `docs/`. This public repository ignores that folder.

## Rules

Never commit secrets (`.dev.vars`, `.env*`) or client evidence. No DNS, production or custom-domain changes without approval. See `CLAUDE.md`.
