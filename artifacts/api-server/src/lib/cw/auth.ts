import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";
import { getDb, schema } from "./db";
import { ensureBootstrapped } from "./bootstrap";

const SESSION_COOKIE = "cw_session";
const SESSION_DAYS = 30;

/**
 * Session signing secret. Uses AUTH_SECRET when provided; otherwise a random
 * secret is generated on first boot and persisted in the database, so the
 * site works on Replit with no manual environment configuration.
 */
let cachedSecret: Uint8Array | null = null;

async function getAuthSecret(): Promise<Uint8Array> {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv) {
    cachedSecret = new TextEncoder().encode(fromEnv);
    return cachedSecret;
  }
  await ensureBootstrapped();
  const db = await getDb();
  const rows = await db.select().from(schema.kv).where(eq(schema.kv.key, "auth.secret"));
  let secret = rows[0]?.value;
  if (!secret) {
    secret = randomBytes(32).toString("hex");
    await db
      .insert(schema.kv)
      .values({ key: "auth.secret", value: secret })
      .onConflictDoNothing();
    const again = await db.select().from(schema.kv).where(eq(schema.kv.key, "auth.secret"));
    secret = again[0]?.value ?? secret;
  }
  cachedSecret = new TextEncoder().encode(secret);
  return cachedSecret;
}

export async function hasAdminUser(): Promise<boolean> {
  await ensureBootstrapped();
  const db = await getDb();
  const rows = await db.select({ id: schema.adminUsers.id }).from(schema.adminUsers).limit(1);
  return rows.length > 0;
}

/** The single admin account, or null when none is provisioned yet. */
export async function getAdminUser(): Promise<{ id: string; email: string } | null> {
  await ensureBootstrapped();
  const db = await getDb();
  const rows = await db
    .select({ id: schema.adminUsers.id, email: schema.adminUsers.email })
    .from(schema.adminUsers)
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Set a new password for the admin. Because the session fingerprint is derived
 * from the password hash (see sessionFingerprint / getSession), changing it
 * here revokes every previously issued session — this is what logs out all
 * devices after a self-service reset. The new hash is app-owned and survives
 * restarts: seedAdminFromSecrets no longer overwrites an existing admin.
 */
export async function setAdminPassword(email: string, newPassword: string): Promise<void> {
  const db = await getDb();
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(schema.adminUsers)
    .set({ passwordHash })
    .where(eq(schema.adminUsers.email, email.trim().toLowerCase()));
}

export async function verifyCredentials(email: string, password: string): Promise<boolean> {
  await ensureBootstrapped();
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, email.trim().toLowerCase()));
  const user = rows[0];
  if (!user) return false;
  return bcrypt.compare(password, user.passwordHash);
}

/**
 * Short one-way fingerprint of the stored password hash. Embedded in the
 * session JWT and re-checked on every request, so rotating ADMIN_PASSWORD (or
 * ADMIN_EMAIL) via seedAdminFromSecrets invalidates all previously issued
 * sessions — this is what makes "change the secret + redeploy" a real reset.
 */
function sessionFingerprint(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

export async function createSession(res: Response, email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, normalizedEmail));
  const user = rows[0];
  if (!user) throw new Error("Cannot create a session for an unknown admin.");
  const secret = await getAuthSecret();
  const token = await new SignJWT({
    sub: normalizedEmail,
    role: "admin",
    pv: sessionFingerprint(user.passwordHash),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function destroySession(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export async function getSession(req: Request): Promise<{ email: string } | null> {
  const token = (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE];
  if (!token) return null;
  try {
    const secret = await getAuthSecret();
    const { payload } = await jwtVerify(token, secret);
    if (
      payload.role !== "admin" ||
      typeof payload.sub !== "string" ||
      typeof payload.pv !== "string"
    ) {
      return null;
    }
    // Revoke the session if the admin no longer exists or the credentials were
    // rotated (password/email changed), which changes the hash fingerprint.
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, payload.sub));
    const user = rows[0];
    if (!user || sessionFingerprint(user.passwordHash) !== payload.pv) return null;
    return { email: payload.sub };
  } catch {
    return null;
  }
}
