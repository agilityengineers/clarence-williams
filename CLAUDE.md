# ClarenceWilliams.com — Build Notes (for Claude Code handoff)

## Non-negotiable requirement: modular, admin-managed site
The production site MUST be built as a modular application with an admin backend. The admin must be able to, from within the site's own admin UI (no code changes):

- **Toggle sections on/off** per page (Hero, Services, Your Brand's Story, About, Proof, Ventures, Book a Call). The prototype models this with boolean props on `Site — One Page.dc.html` (Tweaks panel = admin stand-in).
- **Edit content** of admin-managed sections: Proof (metrics + testimonials), Affiliated Ventures (brand list/wordmarks), bio copy, and contact details.
- **Replace imagery**, especially the hero portrait (transparent-cutout PNG) and about portrait. Prototype uses drag-and-drop `<image-slot>` placeholders.
- **Switch hero background theme** (Midnight Navy default; Warm Charcoal, Ivory, Terracotta variants exist as a prop on `Hero Section.dc.html`).

## Architecture of the prototype (mirror this modularity)
- `Hero Section.dc.html` — approved hero, do not redesign. (`Hero Section v2` was an exploration, not chosen.)
- `Section *.dc.html` — reusable section components shared by all pages.
- `Site — One Page.dc.html` — long-scrolling assembly with section toggles.
- `Page Home/Services/About.dc.html` — multi-page assembly, clickable nav.

## Brand
- Palette: deep navy `#0B1626`, ivory `#F7F4EE`, gold accent `#C9A24B` (dark bg) / bronze `#B0793F` (light bg), navy ink `#10233A`.
- Type: Cormorant Garamond (display/serif) + Archivo (text/labels).
- Logo: interlocking CW monogram — `assets/logo-gold.png` (dark bg), `assets/logo-navy.png` (light bg). Also used as favicon.
- Messaging framework: "Your Brand's Story" (never "StoryBrand") — client is the hero, Clarence is the guide, idea → production.
- Service pillar order is fixed: 1. Business Consulting, 2. Software Delivery Leadership, 3. Brand & Marketing.
- Tone: formal and authoritative. No emoji.

## Booking & assessments (build in Claude Code)
- **Calendly link is admin-managed.** Every "Book a Call" CTA reads its URL from an admin setting — never hard-coded. Initial value: `https://calendly.com/clarencewilliams/15min`.
- **Two distinct client-facing assessments**, each ~10 questions, short (~3 min), NOT lengthy:
  1. **Agility Assessment** — agile/delivery questions (delivery model, release cadence, predictability, sponsorship, metrics) that qualify a company as an ideal client for agile transformation services.
  2. **Business Health Assessment** — separate instrument (revenue trend, profitability, owner dependence, pipeline predictability, customer concentration, etc.). Same flow/criteria pattern, different content. Do not merge the two.
- **Scoring algorithm**: qualification scoring is to be designed during Claude Code development. A score/tier IS shown to the client at the end (prototype shows 0–100 + tier + recommended next step). The prototype's scoring is illustrative placeholder math only.
- Assessment results should qualify leads (ideal-client fit) and route to the Book-a-Call CTA.
- Question sets and copy must be admin-editable, like all other admin-managed content.
- **Post-production editability is required**: after launch, the admin must be able to augment and update BOTH assessments entirely from the admin dashboard — add/remove/reorder questions, edit question and answer text, adjust answer weights/scoring, and edit result-tier labels/copy — with no developer involvement or code changes.
- Prototype: `Page Assessment.dc.html` — switch between the two assessments via the `assessment` prop (Tweaks panel). More detail on this process may follow from Clarence.

## Insights / RSS feed section (build in Claude Code)
- Modular, admin-toggleable **Executive Insights** section (`Section Insights.dc.html`) that renders articles from an RSS feed.
- **Feed URL is admin-managed** — supports rss.app-format feeds and direct RSS, default: `https://ceo-advisory-group.com/newsletter/feed/rss`.
- **Admin chooses the number of articles shown** (prototype: 1–9 slider) and the **display format** — three formats exist in the prototype: Editorial List, Card Grid, Feature + List. Admin picks per placement.
- Prototype fetches the live feed client-side and falls back to baked sample articles when CORS blocks it; production should fetch/cache server-side.

## Platform decisions (from Clarence)
- **Tech stack**: Claude Code's choice — pick what best serves an admin-managed modular site with SEO-capable dynamic pages.
- **Admin**: single admin login (Clarence).
- **Page builder**: the admin must be able to assemble NEW pages from the existing section library (nav + ordered stack of sections + footer) without a developer. Every page in the prototype follows exactly this composition pattern.
- **AI-generated pages**: Clarence will use AI APIs (Anthropic/Claude, OpenAI) to generate additional pages for partners, brands, products, and services he is associated with. Requirements: (1) these pages are NOT linked from the homepage; (2) they must be SEO-optimizable (own meta/title/description, clean URLs, server-rendered or statically generated markup, structured data where sensible); (3) after creation, the admin retains maximum flexibility to edit them from the dashboard. Architect page storage/rendering with this programmatic creation path in mind (e.g., pages-as-data with section/block schema + an API surface the AI tools can write to).

## Unlinked, link-only pages (build in Claude Code)
Both pages below are admin-toggleable, share the site nav/footer/brand, and are NOT linked from the homepage or main nav — Clarence shares them by direct link only. Both must be SEO-capable (own meta/title).

- **Author page** (`Page Author.dc.html`): featured latest book **Marketing Mayhem** (cover image, blurb, buttons to https://marketing-mayhem.com/ and Amazon) + a grouped "From the archive" band for past books (single group photo + one collective blurb + one Amazon link — past books are NOT itemized). Admin must be able to add/replace books, edit blurbs, and manage purchase links from the dashboard; when a new book is added, the previous featured book conceptually rolls into the archive group.
- **Resume page** (`Page Resume.dc.html`): a resume REQUEST page — no direct file download. Visitors submit name, email, company, and role/opportunity details; the request is delivered to Clarence (email notification + stored in admin dashboard as a lead), and he replies with a resume tailored to the role. Purpose: collect requester information. Form fields and page copy are admin-editable.

## Content sources
- `uploads/extras-1783102076315.md` — bio options (grounded facts only).
- `uploads/website-blueprint-v2.md` — sitemap/copy blueprint (reference only; do not restructure the designed pages to match it).
- Contact: cw@clarencewilliams.com · (678) 831-5700 · 11877 Douglas Rd, Suite 102, #328, Alpharetta, GA 30005.
