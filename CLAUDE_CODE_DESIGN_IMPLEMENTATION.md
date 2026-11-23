# Claude Code Design Implementation Guide

## Before implementation
Inspect `bontilebiz-portal` architecture, styling conventions, assets, adapter and current state. Preserve sound conventions. Astro/TypeScript/Tailwind/Markdown is preferred subject to verification; do not assume Cloudflare Workers static assets is configured.

## Tokens and assets
Centralize semantic colors/type. Use navy and white; leave orange unresolved until source and HEX are verified. Load Manrope and Inter with fallbacks and low layout shift; check licensing. Use supplied approved logo, genuine headshot and download files only. If absent, use a clearly documented draft placeholder and block publication.

## Layout
Create shared shell, accessible navigation, skip link, footer, buttons, cards, process sequence, case-study template, form and download components. Desktop hero is split and balanced. Mobile DOM/visual order places headline, copy and CTA before portrait. Use responsive type, fluid spacing, measured line lengths and prevent horizontal overflow.

## Interaction and accessibility
Provide hover/focus/pressed/disabled states, visible keyboard focus, logical tab order, semantic headings/landmarks, labeled inputs and descriptive errors. Honor reduced motion; provide static equivalents. Check contrast after orange confirmation and never use color alone for meaning.

## Content and contact
Keep copy and case-study source in Markdown/typed collections with validation and draft state. Do not publish placeholders or unapproved claims. Case studies require evidence, anonymization and owner approval. Choose server-side contact handling compatible with verified runtime; validate/limit submissions, mitigate spam, minimize data and avoid message-body logs. Store credentials only in server bindings. Resend requires verified sender/domain and review of SPF/DKIM/DMARC and Google Workspace mail flow; preserve MX. No DNS, GitHub, production or deployment changes without separate authorization.

## Handoff gates
Review mobile/tablet/desktop, keyboard, focus, semantics, contrast, reduced motion, form errors, downloads, metadata and image loading. Run build/type/lint/test checks only when requested; report exactly what ran. List changed files and unresolved inputs. Launch requires verified orange source, profile facts, approved headshot/case studies/downloads, privacy/contact setup, domain/DNS review and owner approval.
