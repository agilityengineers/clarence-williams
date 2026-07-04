import { asc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { authenticateApiRequest, apiError } from "@/lib/api-auth";
import { serializePage, upsertApiPage, validateApiPage } from "@/lib/api-pages";
import { getBaseUrl } from "@/lib/base-url";

/** List pages (id, slug, status, origin). */
export async function GET(req: Request) {
  if (!(await authenticateApiRequest(req))) return apiError(401, "Invalid or missing API key.");
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
  return Response.json({ pages });
}

/** Create a page from sections. Returns 422 with precise issues on validation failure. */
export async function POST(req: Request) {
  if (!(await authenticateApiRequest(req))) return apiError(401, "Invalid or missing API key.");
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(400, "Request body must be JSON.");
  }
  const validated = validateApiPage(body);
  if (!validated.ok) return apiError(422, "Validation failed.", validated.issues);

  const db = await getDb();
  const existing = await db.query.pages.findFirst({
    where: (p, { eq }) => eq(p.slug, validated.page.slug),
  });
  if (existing) {
    return apiError(409, `A page with slug "${validated.page.slug}" already exists. Use PATCH /api/v1/pages/${validated.page.slug} to update it.`);
  }

  const { id, slug } = await upsertApiPage(validated.page);
  const page = await serializePage(id);
  return Response.json({ page, liveUrl: `${getBaseUrl()}/${slug}` }, { status: 201 });
}
