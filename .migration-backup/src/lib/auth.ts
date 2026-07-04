import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getDb, schema } from "@/db";
import { ensureBootstrapped } from "@/db/bootstrap";

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
  await db.insert(schema.adminUsers).values({
    email: email.trim().toLowerCase(),
    passwordHash: await bcrypt.hash(password, 12),
  });
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

export async function createSession(email: string): Promise<void> {
  const secret = await getAuthSecret();
  const token = await new SignJWT({ sub: email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<{ email: string } | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
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
