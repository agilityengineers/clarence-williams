import { randomBytes, createHash } from "node:crypto";
import { and, eq, isNull, lt } from "drizzle-orm";
import { getDb, schema } from "./db";

/**
 * Admin self-service password reset: single-use, time-limited tokens. Only the
 * SHA-256 hash of a token is ever stored (schema.passwordResetTokens); the raw
 * token lives only in the link emailed to the configured admin. See
 * routes/cw-auth.ts for the request/complete endpoints.
 */

/** How long a reset link stays valid after it is issued. */
export const TOKEN_TTL_MINUTES = 30;

export function hashResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Issue a reset token for an already-verified admin email. Any outstanding
 * tokens for that email are dropped first, so only the newest link works.
 * Returns the raw token (for the emailed link) and its expiry — only the hash
 * is persisted.
 */
export async function createResetToken(
  email: string,
): Promise<{ token: string; expiresAt: Date }> {
  const db = await getDb();
  const normalized = email.trim().toLowerCase();
  await db
    .delete(schema.passwordResetTokens)
    .where(eq(schema.passwordResetTokens.email, normalized));
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);
  await db.insert(schema.passwordResetTokens).values({
    email: normalized,
    tokenHash: hashResetToken(token),
    expiresAt,
  });
  return { token, expiresAt };
}

/**
 * Validate and consume a reset token. Returns the email it was issued for, or
 * null when the token is unknown, already used, or expired. The row is marked
 * used before returning (guarded on usedAt still being null) so a token can
 * only ever complete one reset, even under concurrent requests.
 */
export async function consumeResetToken(rawToken: string): Promise<string | null> {
  if (!rawToken) return null;
  const db = await getDb();
  const tokenHash = hashResetToken(rawToken);
  const rows = await db
    .select()
    .from(schema.passwordResetTokens)
    .where(eq(schema.passwordResetTokens.tokenHash, tokenHash));
  const row = rows[0];
  if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) return null;
  const claimed = await db
    .update(schema.passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(schema.passwordResetTokens.id, row.id),
        isNull(schema.passwordResetTokens.usedAt),
      ),
    )
    .returning({ id: schema.passwordResetTokens.id });
  if (claimed.length === 0) return null;
  return row.email;
}

/** Opportunistic cleanup: drop tokens that have already expired. */
export async function pruneExpiredResetTokens(): Promise<void> {
  const db = await getDb();
  await db
    .delete(schema.passwordResetTokens)
    .where(lt(schema.passwordResetTokens.expiresAt, new Date()));
}
