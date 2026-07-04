/**
 * Per-page document head updates. This runs client-side, so only
 * JS-executing crawlers (Google) see these values — link-preview crawlers
 * (LinkedIn, Facebook) read the static tags baked into index.html.
 */

function upsertMeta(attr: "name" | "property", key: string, content: string): void {
  let meta = document.querySelector(`meta[${attr}="${key}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

export function applyPageMeta({
  title,
  description,
  ogImage,
}: {
  title: string;
  description?: string;
  ogImage?: string;
}): void {
  document.title = title;
  upsertMeta("property", "og:title", title);
  upsertMeta("name", "twitter:title", title);
  upsertMeta("property", "og:url", window.location.href);
  if (description) {
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:description", description);
    upsertMeta("name", "twitter:description", description);
  }
  if (ogImage) {
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("name", "twitter:image", ogImage);
  }
}
