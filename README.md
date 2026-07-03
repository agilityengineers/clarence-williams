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

## Build stages

1. ✅ Scaffold — stack, schema, auth, tokens, nav/footer, Replit config
2. Public site — pixel-faithful sections and pages (1920px design, responsive)
3. Admin dashboard — content editors, page builder, media, settings
4. Assessments — two scored instruments + editor + leads
5. RSS Insights — server-side fetch/cache, three layouts
6. AI page API — authenticated endpoints for programmatic page creation
