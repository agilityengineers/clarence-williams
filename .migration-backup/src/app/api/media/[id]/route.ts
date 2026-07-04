import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ensureBootstrapped } from "@/db/bootstrap";

/**
 * Serves admin-uploaded images from the database (Replit's deploy
 * filesystem is ephemeral, so uploads live in Postgres). Media ids are
 * immutable UUIDs — replacing an image mints a new id — so responses are
 * cacheable forever.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return new Response("Not found", { status: 404 });
  }
  await ensureBootstrapped();
  const db = await getDb();
  const rows = await db.select().from(schema.media).where(eq(schema.media.id, id));
  const item = rows[0];
  if (!item) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(item.data), {
    headers: {
      "Content-Type": item.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${item.filename.replace(/[^\w.-]/g, "_")}"`,
    },
  });
}
