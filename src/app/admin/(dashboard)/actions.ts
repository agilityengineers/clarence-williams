"use server";

import { createHash, randomBytes } from "node:crypto";
import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getSession } from "@/lib/auth";
import { sectionSchemas, stackableSectionTypes, type SectionType } from "@/lib/sections/schemas";
import { siteSettingsSchema, saveSiteSettings } from "@/lib/settings";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Not authorized.");
  return session;
}

export type ActionResult = { ok: boolean; error?: string };

/* ------------------------------ settings ------------------------------ */

export async function saveSettingsAction(value: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = siteSettingsSchema.safeParse(value);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  await saveSiteSettings(parsed.data);
  revalidatePath("/", "layout");
  return { ok: true };
}

/* --------------------------- section content --------------------------- */

export async function saveSectionContentAction(
  type: string,
  content: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  if (!(type in sectionSchemas)) return { ok: false, error: `Unknown section type "${type}".` };
  const parsed = sectionSchemas[type as SectionType].safeParse(content);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const db = await getDb();
  await db
    .insert(schema.sectionContent)
    .values({ type, content: parsed.data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.sectionContent.type,
      set: { content: parsed.data, updatedAt: new Date() },
    });
  revalidatePath("/", "layout");
  return { ok: true };
}

/* -------------------------------- media -------------------------------- */

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);

export async function uploadMediaAction(
  formData: FormData,
): Promise<ActionResult & { id?: string }> {
  await requireAdmin();
  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a file to upload." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Image must be 8 MB or smaller." };
  if (!ALLOWED_MIME.has(file.type)) return { ok: false, error: `Unsupported image type: ${file.type || "unknown"}.` };
  const db = await getDb();
  const data = Buffer.from(await file.arrayBuffer());
  const [row] = await db
    .insert(schema.media)
    .values({ filename: file.name, mimeType: file.type, alt, data })
    .returning({ id: schema.media.id });
  revalidatePath("/admin/media");
  return { ok: true, id: row.id };
}

export async function deleteMediaAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  await db.delete(schema.media).where(eq(schema.media.id, id));
  revalidatePath("/admin/media");
  return { ok: true };
}

/* -------------------------------- pages -------------------------------- */

const pageMetaSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and dashes."),
  title: z.string().min(1).max(200),
  metaTitle: z.string().max(300),
  metaDescription: z.string().max(500),
  status: z.enum(["draft", "published"]),
  showInNav: z.boolean(),
  navLabel: z.string().max(60),
  navOrder: z.number().int(),
  includeInSitemap: z.boolean(),
  footerStyle: z.enum(["full", "slim"]),
});

const pageSectionsInputSchema = z.array(
  z.object({
    sectionType: z.string().refine((t) => (stackableSectionTypes as string[]).includes(t), "Unknown section type"),
    enabled: z.boolean(),
    overrides: z.record(z.string(), z.unknown()).nullable(),
  }),
);

export type PageEditorInput = {
  meta: z.infer<typeof pageMetaSchema>;
  sections: z.infer<typeof pageSectionsInputSchema>;
};

const RESERVED_SLUGS = new Set(["admin", "api", "assessment", "sitemap.xml", "robots.txt", "assets"]);

export async function savePageAction(
  pageId: string | null,
  input: PageEditorInput,
): Promise<ActionResult & { id?: string }> {
  await requireAdmin();
  const meta = pageMetaSchema.safeParse(input.meta);
  if (!meta.success) return { ok: false, error: formatZodError(meta.error) };
  const sections = pageSectionsInputSchema.safeParse(input.sections);
  if (!sections.success) return { ok: false, error: formatZodError(sections.error) };
  if (RESERVED_SLUGS.has(meta.data.slug)) return { ok: false, error: `"${meta.data.slug}" is a reserved path.` };

  const db = await getDb();
  const existing = await db.select().from(schema.pages).where(eq(schema.pages.slug, meta.data.slug));
  if (existing[0] && existing[0].id !== pageId) {
    return { ok: false, error: `A page with slug "${meta.data.slug}" already exists.` };
  }

  let id = pageId;
  if (id) {
    await db
      .update(schema.pages)
      .set({ ...meta.data, navLabel: meta.data.navLabel || null, updatedAt: new Date() })
      .where(eq(schema.pages.id, id));
    await db.delete(schema.pageSections).where(eq(schema.pageSections.pageId, id));
  } else {
    const [row] = await db
      .insert(schema.pages)
      .values({ ...meta.data, navLabel: meta.data.navLabel || null, createdBy: "admin" })
      .returning({ id: schema.pages.id });
    id = row.id;
  }
  for (let i = 0; i < sections.data.length; i++) {
    const s = sections.data[i];
    await db.insert(schema.pageSections).values({
      pageId: id,
      position: i,
      sectionType: s.sectionType,
      enabled: s.enabled,
      overrides: s.overrides,
    });
  }
  revalidatePath("/", "layout");
  return { ok: true, id };
}

export async function deletePageAction(pageId: string): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  const rows = await db.select().from(schema.pages).where(eq(schema.pages.id, pageId));
  if (!rows[0]) return { ok: false, error: "Page not found." };
  if (rows[0].slug === "home") return { ok: false, error: "The home page cannot be deleted." };
  await db.delete(schema.pages).where(eq(schema.pages.id, pageId));
  revalidatePath("/", "layout");
  redirect("/admin/pages");
}

/* -------------------------------- books -------------------------------- */

const bookSchema = z.object({
  title: z.string().min(1).max(300),
  blurb: z.string().max(3000),
  coverMediaId: z.string().nullable(),
  primaryUrl: z.string().max(1000),
  amazonUrl: z.string().max(1000),
  featured: z.boolean(),
});

export async function saveBookAction(bookId: string | null, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const db = await getDb();
  if (parsed.data.featured) {
    // Only one featured book — the previous one conceptually rolls into the archive group.
    await db.update(schema.books).set({ featured: false }).where(eq(schema.books.featured, true));
  }
  if (bookId) {
    await db.update(schema.books).set(parsed.data).where(eq(schema.books.id, bookId));
  } else {
    await db.insert(schema.books).values(parsed.data);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteBookAction(bookId: string): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  await db.delete(schema.books).where(eq(schema.books.id, bookId));
  revalidatePath("/", "layout");
  return { ok: true };
}

/* -------------------------------- leads -------------------------------- */

export async function setResumeRequestStatusAction(
  id: string,
  status: "new" | "replied",
): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  await db.update(schema.resumeRequests).set({ status }).where(eq(schema.resumeRequests.id, id));
  revalidatePath("/admin/leads");
  return { ok: true };
}

export async function setSubmissionStatusAction(
  id: string,
  status: "new" | "handled",
): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  await db
    .update(schema.assessmentSubmissions)
    .set({ status })
    .where(eq(schema.assessmentSubmissions.id, id));
  revalidatePath("/admin/leads");
  return { ok: true };
}

/* ------------------------------- API keys ------------------------------- */

export async function createApiKeyAction(
  label: string,
): Promise<ActionResult & { token?: string }> {
  await requireAdmin();
  if (!label.trim()) return { ok: false, error: "Give the key a label." };
  const token = `cw_${randomBytes(24).toString("hex")}`;
  const db = await getDb();
  await db.insert(schema.apiKeys).values({
    label: label.trim(),
    tokenHash: createHash("sha256").update(token).digest("hex"),
  });
  revalidatePath("/admin/api-keys");
  return { ok: true, token }; // shown once, never stored in plain text
}

export async function revokeApiKeyAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const db = await getDb();
  await db.update(schema.apiKeys).set({ revokedAt: new Date() }).where(eq(schema.apiKeys.id, id));
  revalidatePath("/admin/api-keys");
  return { ok: true };
}

/* ----------------------------- assessments ----------------------------- */

import { assessmentEditorSchema, type AssessmentEditorInput } from "@/lib/assessments";

export async function saveAssessmentAction(
  assessmentId: string,
  input: AssessmentEditorInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = assessmentEditorSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  const db = await getDb();
  const existing = await db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId));
  if (!existing[0]) return { ok: false, error: "Assessment not found." };

  await db
    .update(schema.assessments)
    .set({
      title: parsed.data.title,
      active: parsed.data.active,
      intro: parsed.data.intro,
      resultsCopy: parsed.data.resultsCopy,
      updatedAt: new Date(),
    })
    .where(eq(schema.assessments.id, assessmentId));

  // Replace the full question/option/tier set — simplest correct model for a reorderable editor.
  const oldQuestions = await db
    .select({ id: schema.assessmentQuestions.id })
    .from(schema.assessmentQuestions)
    .where(eq(schema.assessmentQuestions.assessmentId, assessmentId));
  for (const q of oldQuestions) {
    await db.delete(schema.assessmentQuestions).where(eq(schema.assessmentQuestions.id, q.id));
  }
  await db.delete(schema.assessmentTiers).where(eq(schema.assessmentTiers.assessmentId, assessmentId));

  for (let qi = 0; qi < parsed.data.questions.length; qi++) {
    const q = parsed.data.questions[qi];
    const [qRow] = await db
      .insert(schema.assessmentQuestions)
      .values({ assessmentId, position: qi, text: q.text })
      .returning({ id: schema.assessmentQuestions.id });
    for (let oi = 0; oi < q.options.length; oi++) {
      await db.insert(schema.assessmentOptions).values({
        questionId: qRow.id,
        position: oi,
        label: q.options[oi].label,
        weight: q.options[oi].weight,
      });
    }
  }
  for (const tier of parsed.data.tiers) {
    await db.insert(schema.assessmentTiers).values({ assessmentId, ...tier });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/* -------------------------------- helpers ------------------------------- */

function formatZodError(error: z.ZodError): string {
  return error.issues
    .slice(0, 3)
    .map((i) => `${i.path.join(".") || "value"}: ${i.message}`)
    .join(" · ");
}

/** Read helpers used by admin pages (server components). */
export async function listMedia() {
  await requireAdmin();
  const db = await getDb();
  return db
    .select({
      id: schema.media.id,
      filename: schema.media.filename,
      mimeType: schema.media.mimeType,
      alt: schema.media.alt,
      createdAt: schema.media.createdAt,
    })
    .from(schema.media)
    .orderBy(desc(schema.media.createdAt));
}

export async function listPagesForAdmin() {
  await requireAdmin();
  const db = await getDb();
  return db.select().from(schema.pages).orderBy(asc(schema.pages.navOrder), asc(schema.pages.slug));
}
