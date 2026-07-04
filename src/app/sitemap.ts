import type { MetadataRoute } from "next";
import { listAssessments } from "@/lib/assessments";
import { getSitemapPages } from "@/lib/pages";
import { getBaseUrl } from "@/lib/base-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();
  const [pages, assessments] = await Promise.all([getSitemapPages(), listAssessments()]);
  return [
    ...pages.map((p) => ({
      url: p.slug === "home" ? base : `${base}/${p.slug}`,
      lastModified: p.updatedAt,
    })),
    ...assessments
      .filter((a) => a.active)
      .map((a) => ({ url: `${base}/assessment/${a.slug}`, lastModified: a.updatedAt })),
  ];
}
