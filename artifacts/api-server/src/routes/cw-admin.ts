import { createHash, randomBytes } from "node:crypto";
import { Router, type IRouter } from "express";
import multer from "multer";
import { asc, count, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { getDb, schema } from "../lib/cw/db";
import { requireAdmin } from "../middlewares/require-admin";
import { sectionSchemas, sectionTypeLabels, stackableSectionTypes, type SectionType } from "../lib/cw/sections/schemas";
import { getSectionJsonSchemas } from "../lib/cw/sections/jsonschema";
import { siteSettingsSchema, saveSiteSettings, getSiteSettings } from "../lib/cw/settings";
import {
  notificationSettingsSchema,
  getNotificationSettings,
  saveNotificationSettings,
  resolveRecipient,
  renderTemplate,
  htmlToText,
  SAMPLE_LEAD_DATA,
  TEMPLATE_PLACEHOLDERS,
  type LeadKind,
} from "../lib/cw/notifications";
import { isEmailConfigured, sendEmail } from "../lib/cw/notify";
import { assessmentEditorSchema } from "../lib/cw/assessments";

const router: IRouter = Router();

router.use("/admin", requireAdmin);

function formatZodError(error: z.ZodError): string {
  return error.issues
    .slice(0, 3)
    .map((i) => `${i.path.join(".") || "value"}: ${i.message}`)
    .join(" · ");
}

/* ------------------------------ dashboard ------------------------------ */

router.get("/admin/overview", async (_req, res): Promise<void> => {
  const db = await getDb();
  const [pages, newResume, newSubmissions, mediaCount] = await Promise.all([
    db
      .select({ slug: schema.pages.slug, title: schema.pages.title, status: schema.pages.status, id: schema.pages.id })
      .from(schema.pages),
    db.select({ n: count() }).from(schema.resumeRequests).where(eq(schema.resumeRequests.status, "new")),
    db.select({ n: count() }).from(schema.assessmentSubmissions).where(eq(schema.assessmentSubmissions.status, "new")),
    db.select({ n: count() }).from(schema.media),
  ]);
  res.json({
    pages,
    newResumeRequests: newResume[0].n,
    newSubmissions: newSubmissions[0].n,
    mediaCount: mediaCount[0].n,
  });
});

/* ------------------------------ settings ------------------------------ */

router.get("/admin/settings", async (_req, res): Promise<void> => {
  res.json({ settings: await getSiteSettings() });
});

router.put("/admin/settings", async (req, res): Promise<void> => {
  const parsed = siteSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: formatZodError(parsed.error) });
    return;
  }
  await saveSiteSettings(parsed.data);
  res.json({ ok: true });
});

/* ---------------------------- notifications ---------------------------- */

router.get("/admin/notifications", async (_req, res): Promise<void> => {
  const settings = await getNotificationSettings();
  res.json({
    settings,
    configured: isEmailConfigured(),
    placeholders: TEMPLATE_PLACEHOLDERS,
    defaultRecipient: (await getSiteSettings()).contact.email,
  });
});

router.put("/admin/notifications", async (req, res): Promise<void> => {
  const parsed = notificationSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: formatZodError(parsed.error) });
    return;
  }
  await saveNotificationSettings(parsed.data);
  res.json({ ok: true });
});

/** Sends the selected template with sample data so the admin can verify delivery. */
router.post("/admin/notifications/test", async (req, res): Promise<void> => {
  const kind = String(req.body?.kind ?? "");
  if (kind !== "assessment" && kind !== "resume") {
    res.status(400).json({ ok: false, error: "Invalid template kind." });
    return;
  }
  const settings = await getNotificationSettings();
  const template = settings[kind as LeadKind];
  const data = SAMPLE_LEAD_DATA[kind as LeadKind];
  const to = await resolveRecipient(settings);
  const subject = `[Test] ${renderTemplate(template.subject, data, "text")}`;
  const html = renderTemplate(template.html, data, "html");
  const result = await sendEmail({ to, from: settings.from, subject, html, text: htmlToText(html) });
  if (!result.ok) {
    res.status(400).json({ ok: false, error: result.error });
    return;
  }
  res.json({ ok: true, to });
});

/* --------------------------- section content --------------------------- */

router.get("/admin/sections", async (_req, res): Promise<void> => {
  const db = await getDb();
  const rows = await db.select().from(schema.sectionContent);
  res.json({
    sections: rows.map((r) => ({ type: r.type, updatedAt: r.updatedAt })),
    labels: sectionTypeLabels,
  });
});

router.get("/admin/section-schemas", async (_req, res): Promise<void> => {
  res.json({ schemas: getSectionJsonSchemas() });
});

router.get("/admin/sections/:type", async (req, res): Promise<void> => {
  const type = String(req.params.type);
  if (!(type in sectionSchemas)) {
    res.status(404).json({ error: `Unknown section type "${type}".` });
    return;
  }
  const db = await getDb();
  const rows = await db.select().from(schema.sectionContent).where(eq(schema.sectionContent.type, type));
  const jsonSchemas = getSectionJsonSchemas();
  res.json({
    type,
    label: sectionTypeLabels[type as SectionType],
    content: rows[0]?.content ?? null,
    schema: jsonSchemas[type]?.schema ?? null,
  });
});

router.put("/admin/sections/:type", async (req, res): Promise<void> => {
  const type = String(req.params.type);
  if (!(type in sectionSchemas)) {
    res.status(400).json({ ok: false, error: `Unknown section type "${type}".` });
    return;
  }
  const parsed = sectionSchemas[type as SectionType].safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: formatZodError(parsed.error) });
    return;
  }
  const db = await getDb();
  await db
    .insert(schema.sectionContent)
    .values({ type, content: parsed.data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.sectionContent.type,
      set: { content: parsed.data, updatedAt: new Date() },
    });
  res.json({ ok: true });
});

/* -------------------------------- media -------------------------------- */

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES + 1024 } });

router.get("/admin/media", async (_req, res): Promise<void> => {
  const db = await getDb();
  const items = await db
    .select({
      id: schema.media.id,
      filename: schema.media.filename,
      mimeType: schema.media.mimeType,
      alt: schema.media.alt,
      createdAt: schema.media.createdAt,
    })
    .from(schema.media)
    .orderBy(desc(schema.media.createdAt));
  res.json({ items });
});

router.post("/admin/media", upload.single("file"), async (req, res): Promise<void> => {
  const file = req.file;
  const alt = String(req.body?.alt ?? "");
  if (!file || file.size === 0) {
    res.status(400).json({ ok: false, error: "Choose a file to upload." });
    return;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    res.status(400).json({ ok: false, error: "Image must be 8 MB or smaller." });
    return;
  }
  if (!ALLOWED_MIME.has(file.mimetype)) {
    res.status(400).json({ ok: false, error: `Unsupported image type: ${file.mimetype || "unknown"}.` });
    return;
  }
  const db = await getDb();
  const [row] = await db
    .insert(schema.media)
    .values({ filename: file.originalname, mimeType: file.mimetype, alt, data: file.buffer })
    .returning({ id: schema.media.id });
  res.json({ ok: true, id: row.id });
});

router.delete("/admin/media/:id", async (req, res): Promise<void> => {
  const db = await getDb();
  await db.delete(schema.media).where(eq(schema.media.id, String(req.params.id)));
  res.json({ ok: true });
});

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

const RESERVED_SLUGS = new Set(["admin", "api", "assessment", "sitemap.xml", "robots.txt", "assets"]);

router.get("/admin/pages", async (_req, res): Promise<void> => {
  const db = await getDb();
  const pages = await db.select().from(schema.pages).orderBy(asc(schema.pages.navOrder), asc(schema.pages.slug));
  res.json({ pages });
});

router.get("/admin/pages/:id", async (req, res): Promise<void> => {
  const db = await getDb();
  const rows = await db.select().from(schema.pages).where(eq(schema.pages.id, String(req.params.id)));
  const page = rows[0];
  if (!page) {
    res.status(404).json({ error: "Page not found." });
    return;
  }
  const sections = await db
    .select()
    .from(schema.pageSections)
    .where(eq(schema.pageSections.pageId, page.id))
    .orderBy(asc(schema.pageSections.position));
  res.json({ page, sections });
});

router.post("/admin/pages", async (req, res): Promise<void> => {
  const pageId: string | null = req.body?.pageId ?? null;
  const meta = pageMetaSchema.safeParse(req.body?.meta);
  if (!meta.success) {
    res.status(400).json({ ok: false, error: formatZodError(meta.error) });
    return;
  }
  const sections = pageSectionsInputSchema.safeParse(req.body?.sections);
  if (!sections.success) {
    res.status(400).json({ ok: false, error: formatZodError(sections.error) });
    return;
  }
  if (RESERVED_SLUGS.has(meta.data.slug)) {
    res.status(400).json({ ok: false, error: `"${meta.data.slug}" is a reserved path.` });
    return;
  }

  const db = await getDb();
  const existing = await db.select().from(schema.pages).where(eq(schema.pages.slug, meta.data.slug));
  if (existing[0] && existing[0].id !== pageId) {
    res.status(409).json({ ok: false, error: `A page with slug "${meta.data.slug}" already exists.` });
    return;
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
  res.json({ ok: true, id });
});

router.delete("/admin/pages/:id", async (req, res): Promise<void> => {
  const db = await getDb();
  const rows = await db.select().from(schema.pages).where(eq(schema.pages.id, String(req.params.id)));
  if (!rows[0]) {
    res.status(404).json({ ok: false, error: "Page not found." });
    return;
  }
  if (rows[0].slug === "home") {
    res.status(400).json({ ok: false, error: "The home page cannot be deleted." });
    return;
  }
  await db.delete(schema.pages).where(eq(schema.pages.id, rows[0].id));
  res.json({ ok: true });
});

/* -------------------------------- books -------------------------------- */

const bookSchema = z.object({
  title: z.string().min(1).max(300),
  blurb: z.string().max(3000),
  coverMediaId: z.string().nullable(),
  primaryUrl: z.string().max(1000),
  amazonUrl: z.string().max(1000),
  featured: z.boolean(),
});

router.get("/admin/books", async (_req, res): Promise<void> => {
  const db = await getDb();
  const books = await db
    .select()
    .from(schema.books)
    .orderBy(desc(schema.books.featured), asc(schema.books.position), asc(schema.books.createdAt));
  res.json({ books });
});

router.post("/admin/books", async (req, res): Promise<void> => {
  const bookId: string | null = req.body?.bookId ?? null;
  const parsed = bookSchema.safeParse(req.body?.book);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: formatZodError(parsed.error) });
    return;
  }
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
  res.json({ ok: true });
});

router.delete("/admin/books/:id", async (req, res): Promise<void> => {
  const db = await getDb();
  await db.delete(schema.books).where(eq(schema.books.id, String(req.params.id)));
  res.json({ ok: true });
});

/* -------------------------------- leads -------------------------------- */

router.get("/admin/leads", async (_req, res): Promise<void> => {
  const db = await getDb();
  const [submissions, resumeRequests, assessments] = await Promise.all([
    db.select().from(schema.assessmentSubmissions).orderBy(desc(schema.assessmentSubmissions.createdAt)),
    db.select().from(schema.resumeRequests).orderBy(desc(schema.resumeRequests.createdAt)),
    db.select({ id: schema.assessments.id, title: schema.assessments.title }).from(schema.assessments),
  ]);
  res.json({ submissions, resumeRequests, assessments });
});

router.post("/admin/leads/resume/:id/status", async (req, res): Promise<void> => {
  const status = String(req.body?.status ?? "");
  if (status !== "new" && status !== "replied") {
    res.status(400).json({ ok: false, error: "Invalid status." });
    return;
  }
  const db = await getDb();
  await db.update(schema.resumeRequests).set({ status }).where(eq(schema.resumeRequests.id, String(req.params.id)));
  res.json({ ok: true });
});

router.post("/admin/leads/submission/:id/status", async (req, res): Promise<void> => {
  const status = String(req.body?.status ?? "");
  if (status !== "new" && status !== "handled") {
    res.status(400).json({ ok: false, error: "Invalid status." });
    return;
  }
  const db = await getDb();
  await db
    .update(schema.assessmentSubmissions)
    .set({ status })
    .where(eq(schema.assessmentSubmissions.id, String(req.params.id)));
  res.json({ ok: true });
});

/** CSV export of leads (admin only). ?type=resume | assessments */
router.get("/admin/leads/export", async (req, res): Promise<void> => {
  const type = String(req.query.type ?? "");
  const db = await getDb();

  let filename: string;
  let rows: string[][];

  if (type === "resume") {
    const data = await db.select().from(schema.resumeRequests).orderBy(desc(schema.resumeRequests.createdAt));
    filename = "resume-requests.csv";
    rows = [
      ["Date", "Name", "Email", "Company", "Role details", "Status"],
      ...data.map((r) => [r.createdAt.toISOString(), r.name, r.email, r.company, r.roleDetails, r.status]),
    ];
  } else {
    const [data, assessments] = await Promise.all([
      db.select().from(schema.assessmentSubmissions).orderBy(desc(schema.assessmentSubmissions.createdAt)),
      db.select().from(schema.assessments),
    ]);
    const names = new Map(assessments.map((a) => [a.id, a.title]));
    filename = "assessment-leads.csv";
    rows = [
      ["Date", "Assessment", "Name", "Email", "Phone", "Score", "Tier", "Status"],
      ...data.map((s) => [
        s.createdAt.toISOString(),
        names.get(s.assessmentId) ?? s.assessmentId,
        s.name,
        s.email,
        s.phone,
        String(s.score),
        s.tierLabel,
        s.status,
      ]),
    ];
  }

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  res.set({
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
  });
  res.send(csv);
});

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/* ------------------------------- API keys ------------------------------- */

router.get("/admin/api-keys", async (_req, res): Promise<void> => {
  const db = await getDb();
  const keys = await db
    .select({
      id: schema.apiKeys.id,
      label: schema.apiKeys.label,
      createdAt: schema.apiKeys.createdAt,
      lastUsedAt: schema.apiKeys.lastUsedAt,
      revokedAt: schema.apiKeys.revokedAt,
    })
    .from(schema.apiKeys)
    .orderBy(desc(schema.apiKeys.createdAt));
  res.json({ keys });
});

router.post("/admin/api-keys", async (req, res): Promise<void> => {
  const label = String(req.body?.label ?? "");
  if (!label.trim()) {
    res.status(400).json({ ok: false, error: "Give the key a label." });
    return;
  }
  const token = `cw_${randomBytes(24).toString("hex")}`;
  const db = await getDb();
  await db.insert(schema.apiKeys).values({
    label: label.trim(),
    tokenHash: createHash("sha256").update(token).digest("hex"),
  });
  res.json({ ok: true, token }); // shown once, never stored in plain text
});

router.post("/admin/api-keys/:id/revoke", async (req, res): Promise<void> => {
  const db = await getDb();
  await db.update(schema.apiKeys).set({ revokedAt: new Date() }).where(eq(schema.apiKeys.id, String(req.params.id)));
  res.json({ ok: true });
});

/* ----------------------------- assessments ----------------------------- */

router.get("/admin/assessments", async (_req, res): Promise<void> => {
  const db = await getDb();
  const assessments = await db.select().from(schema.assessments).orderBy(asc(schema.assessments.slug));
  res.json({ assessments });
});

router.get("/admin/assessments/:slug", async (req, res): Promise<void> => {
  const db = await getDb();
  const rows = await db.select().from(schema.assessments).where(eq(schema.assessments.slug, String(req.params.slug)));
  const assessment = rows[0];
  if (!assessment) {
    res.status(404).json({ error: "Assessment not found." });
    return;
  }
  const questions = await db
    .select()
    .from(schema.assessmentQuestions)
    .where(eq(schema.assessmentQuestions.assessmentId, assessment.id))
    .orderBy(asc(schema.assessmentQuestions.position));
  const questionsFull = [];
  for (const q of questions) {
    const options = await db
      .select()
      .from(schema.assessmentOptions)
      .where(eq(schema.assessmentOptions.questionId, q.id))
      .orderBy(asc(schema.assessmentOptions.position));
    questionsFull.push({
      text: q.text,
      options: options.map((o) => ({ label: o.label, weight: o.weight })),
    });
  }
  const tiers = await db
    .select()
    .from(schema.assessmentTiers)
    .where(eq(schema.assessmentTiers.assessmentId, assessment.id));
  res.json({
    assessment: {
      id: assessment.id,
      slug: assessment.slug,
      title: assessment.title,
      active: assessment.active,
      intro: assessment.intro,
      resultsCopy: assessment.resultsCopy,
      questions: questionsFull,
      tiers: tiers
        .sort((a, b) => b.minScore - a.minScore)
        .map((t) => ({
          minScore: t.minScore,
          maxScore: t.maxScore,
          label: t.label,
          headline: t.headline,
          recommendation: t.recommendation,
        })),
    },
  });
});

router.put("/admin/assessments/:id", async (req, res): Promise<void> => {
  const assessmentId = String(req.params.id);
  const parsed = assessmentEditorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: formatZodError(parsed.error) });
    return;
  }
  const db = await getDb();
  const existing = await db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId));
  if (!existing[0]) {
    res.status(404).json({ ok: false, error: "Assessment not found." });
    return;
  }

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
  res.json({ ok: true });
});

export default router;
