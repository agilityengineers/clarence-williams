---
name: cwsite canonical domain / single-domain SEO
description: How the site forces one canonical domain (SITE_URL) for SEO — the 301 redirect, canonical tag, and where SITE_URL must live.
---

# Single canonical domain for SEO (SITE_URL)

Multiple domains point at this one deployment. To avoid duplicate-content splitting,
everything canonicalizes to `SITE_URL` (e.g. `https://clarencewilliams.com`):
a host-based 301 redirect in the api-server, a self-referencing `<link rel="canonical">`
injected per route, and `og:url`/sitemap/`robots.txt` all derived from it.

**Why the canonical-host redirect is gated on `SITE_URL` being set (not `getBaseUrl()`):**
`getBaseUrl()` falls back to the `*.replit.dev`/`*.replit.app` host, so gating on it would
make dev/preview 301-redirect themselves. Gating strictly on an explicit `SITE_URL` means
the redirect only activates in production with a real canonical domain; dev and preview are
untouched. The redirect also skips `/api` and non-GET so the API and the `/api/healthz`
startup health check are never redirected.

**Why `SITE_URL` must live in BOTH the production build env AND the run env** (in
`artifacts/cwsite/.replit-artifact/artifact.toml`, not in the shared `[services.env]`):
- BUILD time: Vite bakes absolute Open Graph URLs + the `robots.txt` Sitemap line into the
  static output — wrong/missing if `SITE_URL` isn't present during the build.
- RUN time: drives the runtime canonical `<link>`, the sitemap XML, and the 301 redirect.
Keep it out of shared `[services.env]` so dev doesn't inherit the prod domain (which would
make dev OG/sitemap URLs point at production and could arm the redirect in dev).

**How to apply / gotchas:**
- Changing the canonical domain = update `SITE_URL` in both prod build.env and run.env.
- Switching apex vs `www` = change the `SITE_URL` value; every other host (incl. the other
  variant) then 301s to it. Every domain you want redirected must still be attached in the
  deployment's Domains tab, and the canonical domain must resolve or you get a broken chain.
- Verify a build+run with `SITE_URL` set and curl different `Host:` headers: non-canonical →
  301 to canonical, `/api/healthz` → 200, canonical host → 200 with the `<link rel="canonical">`.
