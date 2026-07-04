---
name: Drizzle raw SQL inserts vs app-side defaults
description: Pitfalls when writing raw SQL INSERTs against Drizzle-defined tables in this project
---

Rule: the shared `id()` helper in `lib/db` schemas uses `$defaultFn(() => crypto.randomUUID())` — an **app-side** default. Raw SQL INSERTs bypass it, so they must supply `id` explicitly or fail with a NOT NULL violation.

**Why:** Hit this when adding an atomic `INSERT ... SELECT ... WHERE NOT EXISTS` singleton guard; the insert failed despite looking correct because there is no DB-level default on `id`.

**How to apply:** Any `db.execute(sql\`INSERT ...\`)` against these tables: include `id` (generate a UUID in JS) and cast bare SELECT-list params (`${x}::text`) — Postgres cannot infer parameter types in a bare SELECT list. Drizzle's "Failed query" error hides the real PG message; re-run the SQL directly against the DB to see it.
