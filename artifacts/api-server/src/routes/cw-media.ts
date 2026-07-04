import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../lib/cw/db";
import { ensureBootstrapped } from "../lib/cw/bootstrap";

const router: IRouter = Router();

/**
 * Serves admin-uploaded images from the database (the deploy filesystem is
 * ephemeral, so uploads live in Postgres). Media ids are immutable UUIDs —
 * replacing an image mints a new id — so responses are cacheable forever.
 */
router.get("/media/:id", async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    res.status(404).send("Not found");
    return;
  }
  await ensureBootstrapped();
  const db = await getDb();
  const rows = await db.select().from(schema.media).where(eq(schema.media.id, id));
  const item = rows[0];
  if (!item) {
    res.status(404).send("Not found");
    return;
  }
  res.set({
    "Content-Type": item.mimeType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Disposition": `inline; filename="${item.filename.replace(/[^\w.-]/g, "_")}"`,
  });
  res.send(Buffer.from(item.data));
});

export default router;
