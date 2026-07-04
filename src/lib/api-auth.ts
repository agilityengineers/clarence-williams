import "server-only";
import { createHash } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ensureBootstrapped } from "@/db/bootstrap";

/** Validates a Bearer token from the Authorization header against stored key hashes. */
export async function authenticateApiRequest(req: Request): Promise<boolean> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(cw_[a-f0-9]{48})$/i);
  if (!match) return false;
  await ensureBootstrapped();
  const db = await getDb();
  const tokenHash = createHash("sha256").update(match[1]).digest("hex");
  const rows = await db
    .select()
    .from(schema.apiKeys)
    .where(and(eq(schema.apiKeys.tokenHash, tokenHash), isNull(schema.apiKeys.revokedAt)));
  if (!rows[0]) return false;
  await db.update(schema.apiKeys).set({ lastUsedAt: new Date() }).where(eq(schema.apiKeys.id, rows[0].id));
  return true;
}

export function apiError(status: number, message: string, details?: unknown): Response {
  return Response.json({ error: message, details }, { status });
}
