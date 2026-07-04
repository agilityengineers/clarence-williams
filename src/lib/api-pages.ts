import "server-only";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { sectionSchemas, stackableSectionTypes, type SectionType } from "@/lib/sections/schemas";

/**
 * Shared logic for the AI page-creation API (/api/v1/pages). Pages created
 * here are ordinary page rows — identical to admin-built pages and fully
 * editable in the dashboard afterward.
 */

const apiSectionSchema = z.object({
  type: z.string(),
  enabled: z.boolean().default(true),
  /** Full section content. Validated against the section's schema. Omit to use the shared/site-wide content. */
  content: z.record(z.string(), z.unknown()).optional(),
});

export const apiPageInputSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase letters, numbers, and dashes only"),
  title: z.string().min(1).max(200),
  metaTitle: z.string().max(300).default(""),
  metaDescription: z.string().max(500).default(""),
  status: z.enum(["draft", "published"]).default("published"),
  /** AI pages are unlinked by default per requirements. */
  showInNav: z.boolean().default(false),
  includeInSitemap: z.boolean().default(true),
  footerStyle: z.enum(["full", "slim"]).default("full"),
  jsonLd: z.record(z.string(), z.unknown()).nullable().default(null),
  sections: z.array(apiSectionSchema).min(1).max(30),
});

export type ApiPageInput = z.infer<typeof apiPageInputSchema>;

const RESERVED_SLUGS = new Set(["home", "admin", "api", "assessment", "sitemap.xml", "robots.txt", "assets"]);

export type ApiValidationIssue = { path: string; message: string };

export function validateApiPage(input: unknown):
  | { ok: true; page: ApiPageInput }
  | { ok: false; issues: ApiValidationIssue[] } {
  const parsed = apiPageInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    };
  }
  const issues: ApiValidationIssue[] = [];
  if (RESERVED_SLUGS.has(parsed.data.slug)) {
    issues.push({ path: "slug", message: `"${parsed.data.slug}" is reserved.` });
  }
  parsed.data.sections.forEach((s, i) => {
    if (!(stackableSectionTypes as string[]).includes(s.type)) {
      issues.push({
        path: `sections.${i}.type`,
        message: `Unknown section type "${s.type}". See GET /api/v1/section-schemas for the catalog.`,
      });
      return;
    }
    if (s.content !== undefined) {
      const check = sectionSchemas[s.type as SectionType].safeParse(s.content);
      if (!check.success) {
        for (const issue of check.error.issues.slice(0, 5)) {
          issues.push({
            path: `sections.${i}.content.${issue.path.join(".")}`,
            message: issue.message,
          });
        }
      }
    }
  });
  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, page: parsed.data };
}

export async function upsertApiPage(
  input: ApiPageInput,
  existingId?: string,
): Promise<{ id: string; slug: string }> {
  const db = await getDb();
  const values = {
    slug: input.slug,
    title: input.title,
    metaTitle: input.metaTitle || input.title,
    metaDescription: input.metaDescription,
    status: input.status,
    showInNav: input.showInNav,
    includeInSitemap: input.includeInSitemap,
    footerStyle: input.footerStyle,
    jsonLd: input.jsonLd,
    updatedAt: new Date(),
  };
  let id = existingId;
  if (id) {
    await db.update(schema.pages).set(values).where(eq(schema.pages.id, id));
    await db.delete(schema.pageSections).where(eq(schema.pageSections.pageId, id));
  } else {
    const [row] = await db
      .insert(schema.pages)
      .values({ ...values, createdBy: "api" })
      .returning({ id: schema.pages.id });
    id = row.id;
  }
  for (let i = 0; i < input.sections.length; i++) {
    const s = input.sections[i];
    await db.insert(schema.pageSections).values({
      pageId: id,
      position: i,
      sectionType: s.type,
      enabled: s.enabled,
      overrides: s.content ?? null,
    });
  }
  return { id, slug: input.slug };
}

export async function serializePage(pageId: string) {
  const db = await getDb();
  const rows = await db.select().from(schema.pages).where(eq(schema.pages.id, pageId));
  const page = rows[0];
  if (!page) return null;
  const sections = await db
    .select()
    .from(schema.pageSections)
    .where(eq(schema.pageSections.pageId, pageId))
    .orderBy(asc(schema.pageSections.position));
  return {
    id: page.id,
    slug: page.slug,
    url: `/${page.slug}`,
    title: page.title,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    status: page.status,
    showInNav: page.showInNav,
    includeInSitemap: page.includeInSitemap,
    footerStyle: page.footerStyle,
    createdBy: page.createdBy,
    jsonLd: page.jsonLd,
    sections: sections.map((s) => ({
      type: s.sectionType,
      enabled: s.enabled,
      content: s.overrides ?? null,
    })),
  };
}
