import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { authenticateApiRequest, apiError } from "@/lib/api-auth";
import { serializePage, upsertApiPage, validateApiPage } from "@/lib/api-pages";
import { getBaseUrl } from "@/lib/base-url";

type Ctx = { params: Promise<{ slug: string }> };

async function findPage(slug: string) {
  const db = await getDb();
  const rows = await db.select().from(schema.pages).where(eq(schema.pages.slug, slug));
  return rows[0] ?? null;
}

export async function GET(req: Request, { params }: Ctx) {
  if (!(await authenticateApiRequest(req))) return apiError(401, "Invalid or missing API key.");
  const { slug } = await params;
  const page = await findPage(slug);
  if (!page) return apiError(404, `No page with slug "${slug}".`);
  return Response.json({ page: await serializePage(page.id) });
}

/** Full update — same body shape as POST /api/v1/pages. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await authenticateApiRequest(req))) return apiError(401, "Invalid or missing API key.");
  const { slug } = await params;
  const page = await findPage(slug);
  if (!page) return apiError(404, `No page with slug "${slug}".`);
  if (page.slug === "home") return apiError(403, "The home page cannot be modified via the API.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(400, "Request body must be JSON.");
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
    ...(body as Record<string, unknown>),
  };
  const validated = validateApiPage(merged);
  if (!validated.ok) return apiError(422, "Validation failed.", validated.issues);
  if (validated.page.slug !== page.slug) {
    const conflict = await findPage(validated.page.slug);
    if (conflict) return apiError(409, `A page with slug "${validated.page.slug}" already exists.`);
  }

  const { id } = await upsertApiPage(validated.page, page.id);
  return Response.json({ page: await serializePage(id), liveUrl: `${getBaseUrl()}/${validated.page.slug}` });
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!(await authenticateApiRequest(req))) return apiError(401, "Invalid or missing API key.");
  const { slug } = await params;
  const page = await findPage(slug);
  if (!page) return apiError(404, `No page with slug "${slug}".`);
  if (page.slug === "home") return apiError(403, "The home page cannot be deleted.");
  const db = await getDb();
  await db.delete(schema.pages).where(eq(schema.pages.id, page.id));
  return Response.json({ deleted: slug });
}
