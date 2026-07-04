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
- **Admin SPA** (`artifacts/cwsite/src/pages/admin`): nested under `/admin` (wouter `nest`); session guard in `AdminApp.tsx` replaces the old Next middleware. The single admin is provisioned from the `ADMIN_EMAIL`/`ADMIN_PASSWORD` secrets on first boot (the old `/admin/setup` claim flow is retired and redirects to `/login`); thereafter the password is managed in-app via the reset flow (see below).
- **Server** (`artifacts/api-server/src/lib/cw` + `src/routes/cw-*.ts`): JWT `cw_session` httpOnly cookie auth (jose), pages/sections CRUD, assessment scoring, media stored as bytea served at `/api/media/:id`, RSS insights proxy, API keys for the bearer-auth `/api/v1` surface.
- **Admin password reset** (`lib/cw/password-reset.ts`, `POST /api/auth/forgot-password` + `/api/auth/reset-password`): email-based, single-use, expiring (30 min) tokens — only the SHA-256 hash is stored, the link is only ever emailed to the configured admin. Requests are rate-limited and responses are non-enumerating (identical whether or not the email matches). Completing a reset changes the password hash, which rotates the session fingerprint and thereby revokes every existing session. Reset UI at `/admin/forgot-password` + `/admin/reset-password` (unauthenticated).
- **Admin provisioning precedence** (`lib/cw/bootstrap.ts` → `seedAdminFromSecrets`): `ADMIN_EMAIL`/`ADMIN_PASSWORD` secrets seed the admin **only when no admin row exists** (first boot on a fresh DB). Once an admin exists its password hash is app-owned, so a self-service reset survives restarts/redeploys — boot never re-hashes the secret over it. Recovery is the "Forgot password?" flow; re-seeding from secrets requires an empty `admin_users` table (break-glass).
- Bootstrap/seed runs on API startup (`lib/cw/bootstrap.ts`); CORS restricted to first-party Replit domains.
- OpenAPI codegen (Orval) is NOT used for the cw routes — they are a direct Express port.

## User preferences

_(none recorded yet)_
