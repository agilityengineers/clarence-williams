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

export type HeadMeta = {
  title: string;
  description?: string;
  ogImage?: string;
  ogUrl: string;
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
  const page = await getPublishedPage(slug);
  if (!page) return null;
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
    ogImage: page.ogImageId ? `${base}/api/media/${page.ogImageId}` : undefined,
    ogUrl: `${base}${path === "/" ? "/" : path}`,
  };
}

async function assessmentMeta(slug: string, base: string, path: string): Promise<HeadMeta | null> {
  const assessment = await getAssessmentBySlug(slug);
  // Mirror the public route, which 404s inactive assessments.
  if (!assessment || !assessment.active) return null;
  return {
    title: `${assessment.title} — Clarence Williams`,
    description: assessment.intro.description || undefined,
    ogUrl: `${base}${path}`,
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

/** Rewrite index.html's head with the resolved per-route meta. */
export function injectHeadMeta(html: string, meta: HeadMeta): string {
  let out = setTitle(html, meta.title);
  out = setMeta(out, "property", "og:title", meta.title);
  out = setMeta(out, "name", "twitter:title", meta.title);
  out = setMeta(out, "property", "og:url", meta.ogUrl);
  if (meta.description) {
    out = setMeta(out, "name", "description", meta.description);
    out = setMeta(out, "property", "og:description", meta.description);
    out = setMeta(out, "name", "twitter:description", meta.description);
  }
  if (meta.ogImage) {
    out = setMeta(out, "property", "og:image", meta.ogImage);
    out = setMeta(out, "name", "twitter:image", meta.ogImage);
  }
  return out;
}
