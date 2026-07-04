---
name: cwsite server-side prerender via createRoot
description: How AI-crawler-visible body content and JSON-LD get into cwsite's initial HTML without real SSR.
---

cwsite is a plain client-side React SPA (`main.tsx` uses
`createRoot(...).render(...)`, not `hydrateRoot`). Because there's no
hydration step, it's safe to inject real server-rendered markup into the
`<div id="root"></div>` shell in the production HTML-serving layer
(`api-server/src/client-serving.ts` + `lib/cw/head-meta.ts` +
`lib/cw/render-body.ts`) — the client simply overwrites it once the bundle
runs, so there's no mismatch warning to worry about.

**Why:** AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Applebot-Extended)
and other non-JS-executing bots only ever see the initial HTML response.
Full SSR/SSG was out of scope for the fix, so a lightweight semantic-HTML
render of the same page/assessment data (real headings, copy, links — not
pixel-perfect component fidelity) is injected server-side instead.

**How to apply:** If adding a new section type or public route, extend
`render-body.ts`'s per-type renderer (and `resolveHeadMeta`'s routing in
`head-meta.ts`) rather than reintroducing an empty shell — that's how a
previous route family (`/`, `/:slug`, `/assessment/:slug`) regressed to
crawler-invisible before this fix. `layout.ts`'s `getPublicLayout()` is the
one shared source for nav/footer/settings data used by both the
`/public/layout` API route and this prerender path — keep them in sync
through it rather than duplicating the DB reads.
