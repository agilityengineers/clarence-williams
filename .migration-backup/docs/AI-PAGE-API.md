# AI Page-Creation API

REST API for creating SEO-ready, unlinked pages programmatically (from
Anthropic/OpenAI tooling or any HTTP client). Pages created here are ordinary
pages — they appear in the admin page builder and stay fully editable there.

## Authentication

Generate a key in **Admin → API Keys**. Send it on every request:

```
Authorization: Bearer cw_<token>
```

## Endpoints

### `GET /api/v1/section-schemas`

The catalog: every section type with the JSON Schema of its content. Have the
AI read this first so it composes valid sections.

### `GET /api/v1/pages`

List all pages (id, slug, status, `createdBy: "admin" | "api"`).

### `POST /api/v1/pages`

Create a page. Body:

```json
{
  "slug": "acme-partnership",
  "title": "Acme Partnership",
  "metaTitle": "Acme × Clarence Williams",
  "metaDescription": "How Clarence Williams partners with Acme.",
  "status": "published",
  "includeInSitemap": true,
  "jsonLd": { "@context": "https://schema.org", "@type": "WebPage", "name": "Acme Partnership" },
  "sections": [
    {
      "type": "prose",
      "content": {
        "background": "navy",
        "eyebrow": "PARTNERSHIP",
        "headline": "Clarence Williams × Acme",
        "paragraphs": ["First paragraph…", "Second paragraph…"]
      }
    },
    { "type": "proof" },
    { "type": "bookCall" }
  ]
}
```

Rules:

- `showInNav` defaults to `false` — AI pages are never linked from the homepage or nav.
- A section **without** `content` renders the site-wide shared content for that type
  (e.g. `{ "type": "proof" }` shows the standard metrics/testimonials).
- A section **with** `content` must match that section's schema exactly
  (see the catalog). Validation failures return `422` with per-field issues —
  feed them back to the model to self-correct.
- `409` means the slug exists — use `PATCH` instead.

Success returns `201` with the stored page and its `liveUrl`. Pages are
server-rendered on demand, so the URL is crawlable immediately.

### `GET /api/v1/pages/{slug}` · `PATCH /api/v1/pages/{slug}` · `DELETE /api/v1/pages/{slug}`

Read, update (partial body allowed — same shape as POST), and delete.
The home page is protected from API modification.

## Example

```bash
curl -s https://<site>/api/v1/pages \
  -H "Authorization: Bearer $CW_API_KEY" \
  -H "Content-Type: application/json" \
  -d @page.json
```
