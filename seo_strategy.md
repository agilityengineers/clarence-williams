# SEO Strategy

## In scope
- Public marketing pages served from the CMS-backed site (`/`, `/:slug` for published public pages)
- Public assessment landing pages (`/assessment/:slug`)
- Public legal pages (`/privacy`, `/terms`)
- Crawlability assets and bot-facing responses (`robots.txt`, `/api/sitemap.xml`, canonical tags, social meta, AI crawler visibility)

## Out of scope
- Authenticated admin dashboard (`/admin/**`)
- Admin authentication and password-reset screens
- Internal API-only routes unrelated to public crawlability

## Target audience
- Prospective consulting clients evaluating Clarence Williams for business consulting, software delivery leadership, brand/marketing guidance, and agile transformation support.

## Primary keywords
- business consultant
- management consultant
- agile transformation consultant
- software delivery leadership consultant
- brand and marketing consultant
- Clarence Williams

## Dismissed categories
- None yet.

## Notes
- Public pages are implemented as a React + Vite SPA in development, while production traffic is intended to flow through the Express api-server for canonical-host redirects and per-route head-tag injection.
- Public SEO evaluation should prioritize what bots receive from the Express-served HTML response in production, while also noting SPA-only risks for crawlers that do not execute JavaScript.
