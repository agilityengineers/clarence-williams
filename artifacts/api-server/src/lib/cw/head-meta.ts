/**
 * Server-side per-route document head resolution + injection.
 *
 * The public site is a React SPA whose per-page <title> / Open Graph /
 * Twitter tags are normally set client-side by `applyPageMeta`
 * (cwsite/src/lib/head.ts). JS-executing crawlers (Google) run that, but
 * social link-preview crawlers (LinkedIn, Facebook, iMessage, Slack) read
 * only the static tags in the served HTML. This module resolves the same
 * DB-backed meta those pages use and rewrites the served index.html so a
 * deep link shared on social renders that page's own card.
 *
 * The values here mirror `applyPageMeta` exactly so crawlers and real users
 * (and Google) see identical meta. Fields left undefined fall back to the
 * defaults already baked into index.html — matching the client, which only
 * upserts tags for values it actually has.
 */
import { getBaseUrl } from "./base-url";
import { getPublishedPage } from "./pages";
import { getAssessmentBySlug } from "./assessments";
import { getPublicLayout } from "./layout";
import { renderAssessmentBodyHtml, renderPageBodyHtml } from "./render-body";

export type HeadMeta = {
  title: string;
  /**
   * Always populated with a page-specific fallback when the DB value is
   * blank — never left `undefined`, so `injectHeadMeta` always overwrites
   * the description tags instead of leaving the home page's copy in place.
   */
  description: string;
  ogImage?: string;
  ogUrl: string;
  /** Server-rendered body markup for the route, for non-JS crawlers. */
  bodyHtml?: string;
  /** Page-level structured data (application/ld+json), if the page has any. */
  jsonLd?: unknown;
};

// The two assessment instruments cross-link to each other in the UI. There
// is no public endpoint listing assessments, so mirror the known pairing
// used client-side (see AssessmentPage.tsx) for the server-rendered link.
const ASSESSMENT_CROSS_LINK: Record<string, string> = {
  agility: "business-health",
  "business-health": "agility",
};

/**
 * Resolve the head meta for a public route path (e.g. "/", "/services",
 * "/assessment/agility"). Returns null for routes that should keep the
 * default index.html meta: admin routes, unknown/not-found pages, and any
 * path outside the public route set (aligned with /api/sitemap.xml).
 */
export async function resolveHeadMeta(pathname: string): Promise<HeadMeta | null> {
  const base = getBaseUrl();
  const clean = pathname.replace(/\/+$/, "") || "/";
  const segments = clean.split("/").filter(Boolean);

  // Home is served at "/" (slug "home"); a literal /home 404s in the SPA.
  if (segments.length === 0) {
    return pageMeta("home", base, "/");
  }
  // Admin/dashboard routes get no previews (out of scope).
  if (segments[0] === "admin") return null;
  if (segments[0] === "assessment" && segments.length === 2) {
    return assessmentMeta(segments[1], base, clean);
  }
  if (segments.length === 1) {
    return pageMeta(segments[0], base, clean);
  }
  return null;
}

async function pageMeta(slug: string, base: string, path: string): Promise<HeadMeta | null> {
  const [page, layout] = await Promise.all([getPublishedPage(slug), getPublicLayout()]);
  if (!page) return null;
  const title = page.metaTitle || page.title;
  return {
    title,
    // Legacy rows created before descriptions were required for publishing may
    // still have a blank metaDescription. Fall back to a page-specific string
    // (never the shared default already baked into index.html) so a page can
    // never silently inherit the home page's description.
    description: page.metaDescription || `${title} — Clarence Williams`,
    ogImage: page.ogImageId ? `${base}/api/media/${page.ogImageId}` : undefined,
    ogUrl: `${base}${path === "/" ? "/" : path}`,
    bodyHtml: renderPageBodyHtml(page, layout),
    jsonLd: page.jsonLd ?? undefined,
  };
}

async function assessmentMeta(slug: string, base: string, path: string): Promise<HeadMeta | null> {
  const [assessment, layout] = await Promise.all([getAssessmentBySlug(slug), getPublicLayout()]);
  // Mirror the public route, which 404s inactive assessments.
  if (!assessment || !assessment.active) return null;
  const otherSlug = ASSESSMENT_CROSS_LINK[slug];
  const title = `${assessment.title} — Clarence Williams`;
  return {
    title,
    description: assessment.intro.description || title,
    ogUrl: `${base}${path}`,
    bodyHtml: renderAssessmentBodyHtml(
      assessment,
      layout,
      otherSlug ? `/assessment/${otherSlug}` : null,
    ),
  };
}

const escapeAttr = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const escapeText = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function setTitle(html: string, title: string): string {
  const tag = `<title>${escapeText(title)}</title>`;
  const re = /<title>[\s\S]*?<\/title>/i;
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

/**
 * Replace an existing `<meta {attr}="{key}" ...>` tag's whole element, or
 * insert one before </head> if none exists. Matches regardless of attribute
 * order and won't confuse e.g. "og:image" with "og:image:width".
 */
function setMeta(html: string, attr: "name" | "property", key: string, content: string): string {
  const tag = `<meta ${attr}="${key}" content="${escapeAttr(content)}" />`;
  const re = new RegExp(`<meta\\b[^>]*\\b${attr}=["']${escapeRegExp(key)}["'][^>]*>`, "i");
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

/**
 * Replace an existing `<link rel="canonical" ...>` element, or insert one
 * before </head> if none exists. Self-referencing canonical pointing at the
 * page's URL on the canonical domain (SITE_URL) tells search engines which
 * domain to index when several domains serve identical content.
 */
function setCanonical(html: string, href: string): string {
  const tag = `<link rel="canonical" href="${escapeAttr(href)}" />`;
  const re = /<link\b[^>]*\brel=["']canonical["'][^>]*>/i;
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

/** Rewrite index.html's head with the resolved per-route meta. */
export function injectHeadMeta(html: string, meta: HeadMeta): string {
  let out = setTitle(html, meta.title);
  out = setMeta(out, "property", "og:title", meta.title);
  out = setMeta(out, "name", "twitter:title", meta.title);
  out = setMeta(out, "property", "og:url", meta.ogUrl);
  out = setCanonical(out, meta.ogUrl);
  out = setMeta(out, "name", "description", meta.description);
  out = setMeta(out, "property", "og:description", meta.description);
  out = setMeta(out, "name", "twitter:description", meta.description);
  if (meta.ogImage) {
    out = setMeta(out, "property", "og:image", meta.ogImage);
    out = setMeta(out, "name", "twitter:image", meta.ogImage);
  }
  return out;
}

/**
 * Inject server-rendered body markup into the empty `<div id="root"></div>`
 * shell so non-JS crawlers see real page content in the initial response.
 * The client mounts with `createRoot(...)` (not `hydrateRoot`), so this
 * markup is simply replaced once the app's JS runs — no hydration mismatch.
 */
export function injectBodyHtml(html: string, bodyHtml: string): string {
  const re = /<div id="root">[\s\S]*?<\/div>/;
  return re.test(html)
    ? html.replace(re, `<div id="root">${bodyHtml}</div>`)
    : html;
}

/**
 * Insert a page's structured data as a `<script type="application/ld+json">`
 * before `</body>`, escaping `</` so the payload can't prematurely close the
 * script element.
 */
export function injectJsonLd(html: string, jsonLd: unknown): string {
  const json = JSON.stringify(jsonLd).replace(/<\//g, "<\\/");
  const tag = `<script type="application/ld+json">${json}</script>`;
  return html.includes("</body>") ? html.replace("</body>", `${tag}\n  </body>`) : html;
}
