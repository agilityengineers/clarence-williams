# Handoff: ClarenceWilliams.com — Modular, Admin-Managed Personal Brand Site

## Overview
A complete design prototype for **ClarenceWilliams.com** — the personal brand site of Clarence Williams (business & management consultant, Vistage Chair, Alpharetta GA). It includes an approved hero, seven reusable content sections, one-page and multi-page site assemblies, two interactive client-qualification assessments, and two unlinked, link-only pages (Author, Resume request).

**Read `CLAUDE.md` in this folder first.** It is the authoritative requirements document: modular architecture, admin-managed content, booking/assessment specs, RSS feed spec, unlinked-page specs, platform decisions, and AI-generated-page requirements. This README documents the design itself.

## About the Design Files
The `.dc.html` files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, **not production code to copy directly**. They use a proprietary streaming-component runtime (`support.js`); ignore that mechanism. The task is to **recreate these designs in a real application stack of your choosing** (per `CLAUDE.md`: stack is Claude Code's choice), using established patterns for a CMS-like, admin-managed site.

Each `.dc.html` file opens directly in a browser for visual reference. Structure of each file: an `<x-dc>` template (all styles inline) plus a `Component` logic class in a trailing `<script>` tag. The `data-props` JSON on that script tag documents **exactly which knobs the admin must control** for that component — treat every prop as an admin setting.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and copy are final design intent. Recreate pixel-perfectly at 1920px design width (make it responsive; the prototype is desktop-only). The **interaction flows** (assessment scoring math, RSS fallback data, resume-form submission) are illustrative placeholders — see `CLAUDE.md` for the real behavior to build.

## Architecture (mirror this)
```
Pages = Nav + ordered stack of Sections + Footer
├─ Hero Section.dc.html            ← approved hero (do NOT redesign)
├─ Section Services.dc.html        ← 3 pillars, fixed order
├─ Section Story.dc.html           ← "Your Brand's Story" 3-step plan
├─ Section About.dc.html           ← bio + credentials
├─ Section Proof.dc.html           ← metrics + testimonials (admin content)
├─ Section Ventures.dc.html        ← affiliated brand wordmarks (admin content)
├─ Section Insights.dc.html        ← RSS feed section (admin: URL, count, format)
├─ Section BookCall.dc.html        ← conversion CTA + global footer
├─ Site — One Page.dc.html         ← long-scroll assembly; boolean props = admin section toggles
├─ Page Home / Services / About    ← multi-page assembly, shared sections
├─ Page Assessment (+ Business Health) ← two distinct 10-question scored flows
├─ Page Author.dc.html             ← UNLINKED: books (featured + archive group)
└─ Page Resume.dc.html             ← UNLINKED: resume request form (lead capture)
```
Every section is independent, reusable, and toggleable. The admin page-builder requirement in `CLAUDE.md` means: new pages are created by picking sections and ordering them — this composition rule is the "logic for building additional pages," and it is also the model for AI-generated pages (pages-as-data).

## Design Tokens
Colors:
- Deep navy (dark bg): `#0B1626`; panel navy: `#0E1B2E` / `#13233B` (hover); halo: `#152238`
- Navy rule/border on dark: `#2A3B52`; muted text on dark: `#A9B4C6`; faint: `#7C8AA0`
- Ivory (light bg): `#F7F4EE`; hover tint: `#F1ECE1`; card white: `#FFFFFF`
- Light rules: `#D8D3C8`; chip border: `#C9B694`
- Ink on light: `#10233A` (headings), `#322E29` (body), `#55514A` (secondary), `#6B675F` (muted), `#9A958A` (faint)
- Gold accent (dark bg): `#C9A24B` — buttons, italic name, numerals
- Bronze accent (light bg): `#B0793F`
- Text on gold button: `#0B1626`; ivory text on dark: `#EDE6D6`; form error: `#D08770`

Typography (Google Fonts):
- **Cormorant Garamond** 400/500/600 + italics — display. H1 hero name 96px (one line, "Clarence" + italic gold "Williams"), page H1 84–96px, section H2 64–76px, stat numerals 88px, card titles 27–32px, footer name lockup 34px.
- **Archivo** 400–700 — everything else. Eyebrows 14px / letter-spacing 0.32em / weight 600; nav links 13px / 0.16em; body 18–21px / line-height 1.65–1.75; buttons 15px / 0.14em / 600, padding 20–22px × 36–48px, **square corners (no border-radius anywhere except circles)**.

Spacing: 100px page gutters; sections pad ~100–110px top / ~96–110px bottom; 1px hairline rules; 36px × 2px accent dash before every eyebrow.

## Screens / Sections (key specs)
- **Nav (site pages)**: sticky, navy, 1px `#2A3B52` bottom border, 18px × 100px padding. Left: 36px gold monogram + "CLARENCE WILLIAMS" (14px caps, 0.24em). Right: links + gold "BOOK A CALL" button. Active page link: ivory with gold underline.
- **Hero**: navy, 1080px tall. Left column ~880px: eyebrow, one-line name (96px), tagline "Your business is the hero of the story. I'm the guide…", 2 CTAs, 3-pillar row (01 Business Consulting / 02 Software Delivery Leadership / 03 Brand & Marketing — "Authority messaging"). Right: transparent-cutout portrait (`assets/portrait-cutout.png`) on a 1040px circle halo (`#152238`) with a thin gold ring offset. Ascending-steps SVG motif bottom-left. **4 admin-selectable background themes** (Midnight Navy default, Warm Charcoal, Ivory, Terracotta) — full token sets in the file's logic class.
- **Services**: ivory; 3 rows in a `120px 460px 1fr` grid — serif bronze number, title + caps sub-line, paragraph + 3 bordered chips.
- **Story**: navy; headline "Every hero needs a guide — and a plan."; 3 numbered circle steps joined by a hairline (step 3 solid gold).
- **About**: ivory; 480×620 portrait with offset bronze frame; quote headline; 2 bio paragraphs; 2×2 credential grid.
- **Proof**: navy; 3 stats (200%+ / 90d→24h / Otis AI) with 88px serif gold numerals; 3 bordered testimonial cards.
- **Ventures**: ivory; 4-column bordered wordmark band (Agility Engineers, CEO Advisory Group, Vistage Chair, Find a Business Pro!); trademark disclaimer line. Admin-editable list.
- **Insights**: ivory; three admin-selectable formats — Editorial List (rows: `90px 190px 176px 1fr 60px` grid with 176×118 thumb), Card Grid (3-up, 240px image), Feature + List. Data from RSS (`media:thumbnail`, title, pubDate, description). Count slider 1–9.
- **BookCall**: navy; centered headline "Stop leading in isolation…"; gold Calendly CTA + outlined assessment CTA; 3-column footer (monogram + serif name lockup, pathways, contact) + legal bar.
- **Assessments**: navy; intro (10 questions / ~3 min / scored) → question screens (progress bar, serif 52px question, A–D option rows that highlight gold on hover, back link) → results (300px circular score dial 0–100, tier headline, recommendation, Book-a-Call CTA). Two separate instruments with distinct questions and distinct result-tier copy; cross-linked on intro screens.
- **Author page** (unlinked): navy featured-book hero — 620×780 cover with offset gold frame, 96px title "Marketing Mayhem", blurb, 2 buttons (marketing-mayhem.com, Amazon); then ivory "From the archive" band — 760×460 group photo of past books, collective blurb, single Amazon link; ends with BookCall section.
- **Resume page** (unlinked): navy; left column — eyebrow "CURRICULUM VITAE", headline "Request my current resume.", 3 credential lines; right — bordered panel form (`#0E1B2E`, 1px `#2A3B52`, 56px padding): FULL NAME*, EMAIL*, COMPANY, ROLE/OPPORTUNITY* textarea, gold submit; validation error line, confirmation state with circled gold ✓. Slim footer with contact info.

## Interactions & Behavior
- Anchor-scroll nav on the one-page site (`#services`, `#story`, `#about`, `#proof`, `#book`); page-to-page links on the multi-page version.
- Hover: option rows/list rows tint + gold border; buttons dim slightly.
- Assessment state: screen (intro/question/results), index, per-question weights; back preserves answers.
- Insights: fetch feed client-side in prototype; production = server-side fetch + cache (see `CLAUDE.md`).
- Resume form: prototype validates required fields and shows a confirmation; production must email Clarence and store the request as a lead in the admin dashboard.
- Portraits and book images are replaceable (admin upload); hero uses a transparent-cutout PNG.

## Assets
- `assets/logo-gold.png` / `assets/logo-navy.png` — CW monogram, recolored from client original; favicon + nav + footer. Gold on dark, navy on light.
- `assets/portrait-cutout.png` — hero cutout (532×763; **request a higher-res cutout for production**).
- `assets/portrait-studio.jpg` — About portrait.
- `content/bio-options.md`, `content/website-blueprint-v2.md` — grounded copy sources (blueprint = reference only, do not restructure to match).
- Book cover and archive group photo: not yet provided — the design shows drop slots; Clarence will supply images.
- Note: the `.dc.html` files reference portraits under `uploads/…`; those files are the same as the two in `assets/`.

## Files
All `.dc.html` files listed in the Architecture diagram, plus `support.js` / `image-slot.js` (prototype runtime only — do not port), `CLAUDE.md` (requirements), and the assets/content folders above.

## Suggested kickoff prompt for Claude Code
> Read `CLAUDE.md` and `README.md` in this folder in full before writing any code. Then propose a tech stack and architecture for this admin-managed modular site — including the admin dashboard, section toggles, page builder, both assessments, the RSS insights section, the unlinked Author/Resume pages, and the AI-page-generation API surface — and wait for my approval before building.
