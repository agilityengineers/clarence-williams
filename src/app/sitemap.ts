import type { MetadataRoute } from "next";
import { getSitemapPages } from "@/lib/pages";
import { getBaseUrl } from "@/lib/base-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();
  const pages = await getSitemapPages();
  return pages.map((p) => ({
    url: p.slug === "home" ? base : `${base}/${p.slug}`,
    lastModified: p.updatedAt,
  }));
}
