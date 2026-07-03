import { and, asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ensureBootstrapped } from "@/db/bootstrap";
import { sectionSchemas, type SectionType } from "@/lib/sections/schemas";

export type ResolvedSection = {
  id: string;
  type: SectionType;
  enabled: boolean;
  /** Shared section content merged with any per-placement overrides, validated. */
  content: unknown;
};

export type ResolvedPage = {
  id: string;
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  status: "draft" | "published";
  includeInSitemap: boolean;
  jsonLd: unknown;
  sections: ResolvedSection[];
};

export async function getNavPages() {
  await ensureBootstrapped();
  const db = await getDb();
  return db
    .select({
      slug: schema.pages.slug,
      navLabel: schema.pages.navLabel,
      title: schema.pages.title,
      navOrder: schema.pages.navOrder,
    })
    .from(schema.pages)
    .where(and(eq(schema.pages.status, "published"), eq(schema.pages.showInNav, true)))
    .orderBy(asc(schema.pages.navOrder));
}

export async function getSectionContentMap(): Promise<Record<string, unknown>> {
  const db = await getDb();
  const rows = await db.select().from(schema.sectionContent);
  return Object.fromEntries(rows.map((r) => [r.type, r.content]));
}

export async function getPublishedPage(slug: string): Promise<ResolvedPage | null> {
  await ensureBootstrapped();
  const db = await getDb();
  const rows = await db.select().from(schema.pages).where(eq(schema.pages.slug, slug));
  const page = rows[0];
  if (!page || page.status !== "published") return null;

  const sectionRows = await db
    .select()
    .from(schema.pageSections)
    .where(eq(schema.pageSections.pageId, page.id))
    .orderBy(asc(schema.pageSections.position));
  const shared = await getSectionContentMap();

  const sections: ResolvedSection[] = [];
  for (const s of sectionRows) {
    if (!(s.sectionType in sectionSchemas)) continue;
    const type = s.sectionType as SectionType;
    const base = (shared[type] as Record<string, unknown> | undefined) ?? {};
    const merged = s.overrides ? { ...base, ...(s.overrides as Record<string, unknown>) } : base;
    const parsed = sectionSchemas[type].safeParse(merged);
    if (!parsed.success) continue; // never let one bad section take a page down
    sections.push({ id: s.id, type, enabled: s.enabled, content: parsed.data });
  }

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    status: page.status,
    includeInSitemap: page.includeInSitemap,
    jsonLd: page.jsonLd,
    sections,
  };
}

export async function getSitemapPages() {
  await ensureBootstrapped();
  const db = await getDb();
  return db
    .select({ slug: schema.pages.slug, updatedAt: schema.pages.updatedAt })
    .from(schema.pages)
    .where(and(eq(schema.pages.status, "published"), eq(schema.pages.includeInSitemap, true)));
}
