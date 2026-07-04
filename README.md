# ClarenceWilliams.com

Modular, admin-managed personal brand site for Clarence Williams — built with
Next.js (App Router), Drizzle ORM, and PostgreSQL. Every page is composed from
a reusable section library and rendered server-side from the database, so all
content, section toggles, and even entire pages are managed from the admin
dashboard (`/admin`) with no code changes.

The design source of truth lives in `design_handoff_clarencewilliams_site/`
(`CLAUDE.md` = requirements, `README.md` = design system).

## Running on Replit (production target)

1. Import this repository from GitHub into Replit.
2. In your Repl, open the **Database** pane and add **PostgreSQL**. Replit
   sets `DATABASE_URL` automatically — no other configuration is required.
3. Run. On first boot the app applies its SQL migrations and seeds the
   initial pages and content automatically.
4. Visit `/admin/setup` once to create the single admin account.
5. For production, use **Deploy → Autoscale** (build `npm run build`,
   run `npm run start` — already configured in `.replit`).

Optional environment variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection string | falls back to embedded PGlite in `./.data` (dev only) |
| `SITE_URL` | Canonical URL for sitemap/SEO | Replit domain, else `http://localhost:3000` |
| `AUTH_SECRET` | Session signing secret | auto-generated and stored in the database |
| `RESEND_API_KEY` | Enables email notifications for resume requests and assessment leads (via resend.com) | unset — leads are still stored in Admin → Leads |
| `NOTIFY_TO` / `NOTIFY_FROM` | Notification recipient / sender override | contact email from settings / Resend onboarding sender |

> **Note:** without `DATABASE_URL` the app uses a local file database that is
> lost on redeploy in hosted environments. Always attach Postgres on Replit.
> Uploaded images are stored in Postgres for the same reason — the deploy
> filesystem is ephemeral.

## Local development

```bash
npm install
npm run dev
```

No database setup needed — an embedded Postgres (PGlite) is created in
`./.data` automatically. Delete that folder to reset.

## Architecture

- **Pages as data** — a page is a row in `pages` plus an ordered list of
  `page_sections` (type, enabled toggle, optional per-placement overrides).
  Shared section copy lives in `section_content`, one validated JSON document
  per section type (schemas in `src/lib/sections/schemas.ts`).
- **Rendering** — `/[slug]` resolves the page, merges shared content with
  overrides, validates with Zod, and renders the section stack server-side
  (SEO-friendly, no rebuilds when content changes).
- **Admin** — single-account credential auth (`/admin`), session JWT cookie.
- **Migrations** — Drizzle SQL migrations in `drizzle/`, applied automatically
  at server boot (`src/instrumentation.ts`). Generate new ones with
  `npm run db:generate` after editing `src/db/schema.ts`.

## What's included (all stages complete)

1. ✅ Scaffold — stack, schema, auth, tokens, nav/footer, Replit config
2. ✅ Public site — pixel-faithful sections and pages (1920px design, responsive),
   unlinked Author + Resume pages, resume-request lead capture
3. ✅ Admin dashboard — section content editors (schema-driven), hero theme +
   imagery, media library (DB-stored), page builder, books, settings, leads
   inbox with CSV export
4. ✅ Assessments — Agility + Business Health flows with required name/email/phone
   capture, server-side scoring, full admin editor (questions, weights, tiers)
5. ✅ RSS Insights — server-side fetch with hourly DB cache, three display
   formats, per-placement overrides in the page builder
6. ✅ AI page API — Bearer-authenticated endpoints (`docs/AI-PAGE-API.md`),
   API-key management in the dashboard

## First-run checklist (production)

1. Visit `/admin/setup` → create the admin account.
2. Admin → Media: upload the hero cutout, studio portrait, and book cover;
   assign them in Sections → Hero / About and in Books.
3. Settings: confirm the Calendly URL and contact details.
4. Optionally set `RESEND_API_KEY` for email notifications of new leads.

## Notes

- The RSS feed is fetched server-side and cached for an hour; if the feed is
  unreachable the section shows the last cached articles (or baked samples on
  a fresh install), never an empty band.
- This development sandbox blocks the feed host, so live-feed fetching should
  be re-verified once on Replit — the code path is exercised and falls back
  gracefully.
