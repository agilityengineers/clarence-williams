import { randomBytes } from "node:crypto";
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

/** First-run setup: creates the single admin account. Refuses if one exists. */
export async function createAdminUser(email: string, password: string): Promise<void> {
  if (await hasAdminUser()) {
    throw new Error("Admin account already exists.");
  }
  const db = await getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);
  // Atomic singleton guard: the INSERT only succeeds when the table is still
  // empty, so two concurrent setup requests cannot both create an admin.
  const result = await db.execute(sql`
    INSERT INTO ${schema.adminUsers} (id, email, password_hash)
    SELECT ${crypto.randomUUID()}::text, ${normalizedEmail}::text, ${passwordHash}::text
    WHERE NOT EXISTS (SELECT 1 FROM ${schema.adminUsers})
  `);
  if (result.rowCount === 0) {
    throw new Error("Admin account already exists.");
  }
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

export async function createSession(res: Response, email: string): Promise<void> {
  const secret = await getAuthSecret();
  const token = await new SignJWT({ sub: email, role: "admin" })
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
    if (payload.role !== "admin" || typeof payload.sub !== "string") return null;
    return { email: payload.sub };
  } catch {
    return null;
  }
}
