import { Router, type IRouter, type Request, type Response } from "express";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "../lib/cw/db";
import { authenticateApiRequest } from "../lib/cw/api-auth";
import { serializePage, upsertApiPage, validateApiPage } from "../lib/cw/api-pages";
import { getBaseUrl } from "../lib/cw/base-url";
import { getSectionJsonSchemas } from "../lib/cw/sections/jsonschema";
import { stackableSectionTypes } from "../lib/cw/sections/schemas";

const router: IRouter = Router();

function apiError(res: Response, status: number, message: string, details?: unknown): void {
  res.status(status).json({ error: message, details });
}

async function requireApiKey(req: Request, res: Response): Promise<boolean> {
  if (await authenticateApiRequest(req)) return true;
  apiError(res, 401, "Invalid or missing API key.");
  return false;
}

/** List pages (id, slug, status, origin). */
router.get("/v1/pages", async (req, res): Promise<void> => {
  if (!(await requireApiKey(req, res))) return;
  const db = await getDb();
  const pages = await db
    .select({
      id: schema.pages.id,
      slug: schema.pages.slug,
      title: schema.pages.title,
      status: schema.pages.status,
      createdBy: schema.pages.createdBy,
      updatedAt: schema.pages.updatedAt,
    })
    .from(schema.pages)
    .orderBy(asc(schema.pages.slug));
  res.json({ pages });
});

/** Create a page from sections. Returns 422 with precise issues on validation failure. */
router.post("/v1/pages", async (req, res): Promise<void> => {
  if (!(await requireApiKey(req, res))) return;
  const body: unknown = req.body;
  const validated = validateApiPage(body);
  if (!validated.ok) {
    apiError(res, 422, "Validation failed.", validated.issues);
    return;
  }

  const db = await getDb();
  const existing = await db.query.pages.findFirst({
    where: (p, { eq: eqOp }) => eqOp(p.slug, validated.page.slug),
  });
  if (existing) {
    apiError(
      res,
      409,
      `A page with slug "${validated.page.slug}" already exists. Use PATCH /api/v1/pages/${validated.page.slug} to update it.`,
    );
    return;
  }

  const { id, slug } = await upsertApiPage(validated.page);
  const page = await serializePage(id);
  res.status(201).json({ page, liveUrl: `${getBaseUrl()}/${slug}` });
});

async function findPage(slug: string) {
  const db = await getDb();
  const rows = await db.select().from(schema.pages).where(eq(schema.pages.slug, slug));
  return rows[0] ?? null;
}

router.get("/v1/pages/:slug", async (req, res): Promise<void> => {
  if (!(await requireApiKey(req, res))) return;
  const slug = String(req.params.slug);
  const page = await findPage(slug);
  if (!page) {
    apiError(res, 404, `No page with slug "${slug}".`);
    return;
  }
  res.json({ page: await serializePage(page.id) });
});

/** Full update — same body shape as POST /api/v1/pages. Partial bodies are merged. */
router.patch("/v1/pages/:slug", async (req, res): Promise<void> => {
  if (!(await requireApiKey(req, res))) return;
  const slug = String(req.params.slug);
  const page = await findPage(slug);
  if (!page) {
    apiError(res, 404, `No page with slug "${slug}".`);
    return;
  }
  if (page.slug === "home") {
    apiError(res, 403, "The home page cannot be modified via the API.");
    return;
  }

  // Allow partial bodies: merge over the page's current serialized form.
  const current = await serializePage(page.id);
  const merged = {
    slug: page.slug,
    title: current?.title,
    metaTitle: current?.metaTitle,
    metaDescription: current?.metaDescription,
    status: current?.status,
    showInNav: current?.showInNav,
    includeInSitemap: current?.includeInSitemap,
    footerStyle: current?.footerStyle,
    jsonLd: current?.jsonLd ?? null,
    sections: current?.sections.map((s) => ({
      type: s.type,
      enabled: s.enabled,
      content: s.content ?? undefined,
    })),
    ...(req.body as Record<string, unknown>),
  };
  const validated = validateApiPage(merged);
  if (!validated.ok) {
    apiError(res, 422, "Validation failed.", validated.issues);
    return;
  }
  if (validated.page.slug !== page.slug) {
    const conflict = await findPage(validated.page.slug);
    if (conflict) {
      apiError(res, 409, `A page with slug "${validated.page.slug}" already exists.`);
      return;
    }
  }

  const { id } = await upsertApiPage(validated.page, page.id);
  res.json({ page: await serializePage(id), liveUrl: `${getBaseUrl()}/${validated.page.slug}` });
});

router.delete("/v1/pages/:slug", async (req, res): Promise<void> => {
  if (!(await requireApiKey(req, res))) return;
  const slug = String(req.params.slug);
  const page = await findPage(slug);
  if (!page) {
    apiError(res, 404, `No page with slug "${slug}".`);
    return;
  }
  if (page.slug === "home") {
    apiError(res, 403, "The home page cannot be deleted.");
    return;
  }
  const db = await getDb();
  await db.delete(schema.pages).where(eq(schema.pages.id, page.id));
  res.json({ deleted: slug });
});

/**
 * Machine-readable catalog of section types and their content JSON Schemas.
 * AI tools read this before composing pages via POST /api/v1/pages.
 */
router.get("/v1/section-schemas", async (req, res): Promise<void> => {
  if (!(await requireApiKey(req, res))) return;
  const all = getSectionJsonSchemas();
  const sections = Object.fromEntries((stackableSectionTypes as string[]).map((t) => [t, all[t]]));
  res.json({
    sections,
    usage: {
      createPage: "POST /api/v1/pages",
      pageShape:
        "{ slug, title, metaTitle?, metaDescription?, status?, showInNav?=false, includeInSitemap?=true, jsonLd?, sections: [{ type, enabled?, content? }] }",
      note: "Omit a section's content to render the site-wide shared content for that section type. Provide content matching the section's schema to override it for this page.",
    },
  });
});

export default router;
