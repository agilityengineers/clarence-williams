---
name: cwsite section visibility (enabled) & schema drift symptom
description: Why the admin "hide section" PUT can 400 with bogus "content field undefined" errors — it's DB schema drift on the section_content.enabled column, not a content bug.
---

# "Hide a section" 400 = schema drift on section_content.enabled

Symptom: in the admin section editor, toggling a section's global visibility
(`PUT /api/admin/sections/:type`) fails with a Zod 400 that looks like a *content*
problem, e.g. `eyebrow: expected string, received undefined · metrics: ... · testimonials: ...`
even though the section's content is fully populated and valid.

**Real cause (non-obvious):** the global section on/off feature stores visibility in a
`section_content.enabled` boolean column. If that column is missing from the database
(schema drift — the feature shipped in code but `enabled` was never applied to this DB),
the running API server ends up on a build that predates the column: its old GET omits
`enabled` and its old PUT validates the *whole* request body (`{content, enabled}`) as if
it were the section content. Since the wrapper object has no `eyebrow/metrics/testimonials`,
Zod reports those as undefined. The error points at content but the fault is the missing column.

**Why:** this project has NO drizzle migration files — schema is applied with
`drizzle-kit push` (`pnpm --filter db push`, run by `scripts/post-merge.sh` after task
merges and manually in dev). A merged feature whose push never reached a given database
leaves that DB drifted while the code assumes the new column.

**How to diagnose / fix:**
- Confirm drift: `select enabled from section_content limit 1;` — if it errors with
  "column enabled does not exist", the DB is drifted.
- Fix: `pnpm --filter @workspace/db run push` (adds `enabled boolean not null default true`,
  so all existing sections stay visible — non-destructive), then restart the
  `artifacts/api-server` workflow so it runs current code against the updated schema.
- Order matters: apply the column BEFORE restarting, or the fresh build's GET
  (`select ... enabled`) 500s.
- The api-server and `drizzle-kit push` both use `DATABASE_URL` via `@workspace/db`, so
  push targets the same DB the app reads.
