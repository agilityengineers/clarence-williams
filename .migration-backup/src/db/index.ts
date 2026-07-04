import * as schema from "./schema";

/**
 * Database client.
 *
 * - When DATABASE_URL is set (Replit's built-in PostgreSQL, Neon, Vercel
 *   Postgres, any standard Postgres) we connect over node-postgres.
 * - When it is not set (local development, fresh checkout) we fall back to
 *   PGlite — an embedded, file-backed Postgres in ./.data/pglite — so the
 *   app runs with zero setup.
 *
 * Both paths speak the same Drizzle API and the same SQL dialect, so moving
 * between Replit and Vercel+Postgres is a connection-string change only.
 */

export type Db = ReturnType<typeof import("drizzle-orm/node-postgres").drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { __cwDb?: Promise<Db> };

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: url,
      // Neon/Replit-hosted Postgres requires TLS; local Postgres usually doesn't.
      ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
      max: 5,
    });
    return drizzle(pool, { schema });
  }
  const { drizzle } = await import("drizzle-orm/pglite");
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  mkdirSync("./.data/pglite", { recursive: true });
  const client = new PGlite("./.data/pglite");
  return drizzle(client, { schema }) as unknown as Db;
}

export function getDb(): Promise<Db> {
  if (!globalForDb.__cwDb) {
    globalForDb.__cwDb = createDb();
  }
  return globalForDb.__cwDb;
}

export { schema };
