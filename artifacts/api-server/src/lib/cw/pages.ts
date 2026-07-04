import { and, asc, eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import { ensureBootstrapped } from "./bootstrap";
import { sectionSchemas, type SectionType } from "./sections/schemas";

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
  ogImageId: string | null;
  status: "draft" | "published";
  includeInSitemap: boolean;
  footerStyle: "full" | "slim";
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

/** Per-type global visibility flags — the admin's site-wide section toggle. */
export async function getSectionEnabledMap(): Promise<Record<string, boolean>> {
  const db = await getDb();
  const rows = await db
    .select({ type: schema.sectionContent.type, enabled: schema.sectionContent.enabled })
    .from(schema.sectionContent);
  return Object.fromEntries(rows.map((r) => [r.type, r.enabled]));
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
  const globalEnabled = await getSectionEnabledMap();

  const sections: ResolvedSection[] = [];
  for (const s of sectionRows) {
    if (!(s.sectionType in sectionSchemas)) continue;
    const type = s.sectionType as SectionType;
    const base = (shared[type] as Record<string, unknown> | undefined) ?? {};
    const merged = s.overrides ? { ...base, ...(s.overrides as Record<string, unknown>) } : base;
    const parsed = sectionSchemas[type].safeParse(merged);
    if (!parsed.success) continue; // never let one bad section take a page down
    // Effective visibility = global site-wide toggle AND this page's placement toggle.
    const enabled = s.enabled && (globalEnabled[type] ?? true);
    sections.push({ id: s.id, type, enabled, content: parsed.data });
  }

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    ogImageId: page.ogImageId,
    status: page.status,
    includeInSitemap: page.includeInSitemap,
    footerStyle: page.footerStyle,
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
