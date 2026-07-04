---
name: cwsite production single-origin serving
description: Why cwsite is served in production by the api-server bundle (not static), and the dev-vs-prod routing split.
---

# cwsite production = single dynamic origin (the api-server bundle)

In production the `cwsite` web service does NOT serve static files. Its `[services.production]`
builds both the SPA and the api-server bundle, then runs `node artifacts/api-server/dist/index.mjs`.
That one Express process serves `/api`, the built static assets, and per-route social
link-preview meta-injected HTML (see `client-serving.ts` + `head-meta.ts`). The `api-server`
artifact has NO `[services.production]` block — it is dev-only.

**Why:** Per-route Open Graph/Twitter meta is injected at request time by the api-server. When
cwsite was served as static files, `/` never reached the api-server, so deep-link social
previews were broken in production. Autoscale exposes a single external dynamic port, so the
correct topology is one dynamic origin serving everything — which is exactly what
`client-serving.ts` was written for ("serves /api, the static assets, and the meta-injected
HTML from one origin").

**How to apply:**
- Dev and prod routing differ on purpose. In DEV, cwsite (Vite) owns `/` and api-server (node)
  owns `/api` as two separate workflows — do not give the api-server service the `/` path or
  you break the Vite dev preview/HMR. In PROD, the cwsite service is the single service and
  runs the api-server bundle.
- The client build must exist for meta injection; `client-serving.ts` resolves it at
  `path.resolve(__dirname, "../../cwsite/dist/public")` where esbuild's banner sets `__dirname`
  to the bundled `artifacts/api-server/dist`. So cwsite MUST be built before/with the server
  in the production build step.
- The Vite build throws without `PORT` and `BASE_PATH`; both come from cwsite's `[services.env]`.
- Verify prod previews with a crawler UA, e.g. `curl -A "facebookexternalhit" <deep-link>` and
  confirm route-specific `og:title`/`og:url` in the returned HTML.
