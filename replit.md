# Clarence Williams Consulting

Premium consulting site (navy/gold brand) for Clarence Williams — public CMS-driven pages, scored lead-gen assessments, and a full admin dashboard. Ported from a Vercel/Next.js app into this pnpm workspace.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/cwsite run dev` — run the public site + admin SPA
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `AUTH_SECRET` (JWT signing; dev fallback exists), `RESEND_API_KEY`, `NOTIFY_TO`, `NOTIFY_FROM` (lead email notifications; skipped if unset), `SITE_URL`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (`artifacts/api-server`), routes under `/api`
- Frontend: React + Vite (`artifacts/cwsite`), wouter routing, TanStack Query, Tailwind v4
- DB: PostgreSQL + Drizzle ORM (schema in `lib/db/src/schema/cwsite.ts`)
- Validation: Zod (`zod/v4`)

## Architecture

- **Public site** (`artifacts/cwsite/src/pages/site`): pages resolved from CMS via `GET /api/public/pages/:slug`; sections rendered by `src/components/sections/SectionRenderer.tsx`. Assessments at `/assessment/:slug` (lead capture requires name, email, AND phone before results).
- **Admin SPA** (`artifacts/cwsite/src/pages/admin`): nested under `/admin` (wouter `nest`); session guard in `AdminApp.tsx` replaces the old Next middleware. First-run setup at `/admin/setup` creates the single admin account (atomic DB guard — only one can ever be created).
- **Server** (`artifacts/api-server/src/lib/cw` + `src/routes/cw-*.ts`): JWT `cw_session` httpOnly cookie auth (jose), pages/sections CRUD, assessment scoring, media stored as bytea served at `/api/media/:id`, RSS insights proxy, API keys for the bearer-auth `/api/v1` surface.
- Bootstrap/seed runs on API startup (`lib/cw/bootstrap.ts`); CORS restricted to first-party Replit domains.
- OpenAPI codegen (Orval) is NOT used for the cw routes — they are a direct Express port.

## User preferences

_(none recorded yet)_
