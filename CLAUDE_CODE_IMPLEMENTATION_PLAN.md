# Claude Code Implementation Plan

## Operating rule
For `bontilebiz-portal`, first inspect and report repository state. Do not overwrite existing project work or change website, DNS, GitHub or production settings without task-specific authorization. These documents are separate deliverables; do not copy them into a project automatically.

## Phase 0 — Discovery
Inventory files, Git status, package manager, Astro version, integrations/adapters, deployment config, content patterns, assets and existing checks. Read-only inspect brand assets/site for orange, logo and conventions; record source and exact value or leave pending. Verify whether the domain and Cloudflare Workers static assets are already configured. Ignore unrelated `PROJECT_BRIEF.md` files. Report findings and proposed implementation map.

## Phase 1 — Foundation and content model
Preserve sound existing conventions. Target Astro + TypeScript + Tailwind + Markdown, subject to discovery. Define typed/validated Markdown collections for services and case studies, including draft/published state. Add shared layout, tokens, navigation, metadata, focus styles, skip link and responsive foundations.

## Phase 2 — Pages
Build Home, About, Services, Case Study index/detail, Contact, Privacy and resume/PDF downloads. Desktop home hero is split-screen; mobile reading order puts text and CTA before the genuine headshot. Use supplied, approved facts only. Draft placeholders must not publish.

## Phase 3 — Contact and privacy
Implement server-side handling compatible with verified runtime. Validate/constrain fields; mitigate spam and abuse; use CSRF protection where applicable; avoid logging message contents. Keep secrets in platform bindings. Resend is blocked until domain/sender, SPF/DKIM/DMARC implications and Google Workspace mail flow are reviewed. Preserve MX. Minimize retention and describe data processing accurately.

## Phase 4 — Quality
Review keyboard use, landmarks, heading order, labels/errors, focus, alt text, reduced motion, contrast, responsive layouts, links, downloads and metadata. Run project build/lint/type/tests only if the task requests verification; report exactly what ran. Review privacy, security, claims, DNS/email and deployment gates.

## Phase 5 — Handoff
Summarize changed files, decisions and unresolved facts. Provide preview/deployment instructions without deploying unless authorized. Launch waits for verified content, orange source, approved portrait/case studies/downloads, contact and privacy configuration, DNS preservation and owner approval.

## Acceptance
Accessible responsive portfolio; Markdown-first content; no fabricated claims; secure server-side contact only after runtime/email verification; current owner-supplied downloads; existing project, DNS, GitHub and Google Workspace mail flow protected unless separately authorized.
