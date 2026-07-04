---
name: Admin provisioning & session revocation
description: How the cwsite admin account is created and how credential rotation revokes sessions
---

# Admin provisioning from secrets

The cwsite admin account is NOT self-service. There is no in-app "claim/setup" flow.
`seedAdminFromSecrets(db)` runs on every boot (in bootstrap, after seeding) and syncs a
single admin row to the `ADMIN_EMAIL` + `ADMIN_PASSWORD` secrets: it deletes any admin whose
email != ADMIN_EMAIL, then creates or (only when the password changed) re-hashes the target.

**Why:** password reset = change the secret + redeploy. Keeping provisioning in bootstrap
means the recovery path needs no UI and no DB access.
**How to apply:** if either secret is absent, the existing admin row is left untouched
(nothing deleted). Both secrets must exist in dev AND production deployment.

# Session revocation on credential rotation

Session JWTs embed a `pv` claim = first 16 hex chars of sha256(passwordHash). `getSession`
re-queries the admin row on every request and rejects the token if the admin is gone or the
fingerprint no longer matches.

**Why:** JWTs are stateless (30-day expiry). Without this check, rotating ADMIN_PASSWORD /
ADMIN_EMAIL would NOT log out existing sessions, so "reset" wouldn't actually revoke access.
**How to apply:** any future change to how the password hash is stored must keep `pv`
derivable from it, or all live sessions silently drop. `createSession` throws if the admin
email has no row — only call it after `verifyCredentials` succeeds.
