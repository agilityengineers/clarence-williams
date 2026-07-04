---
name: Admin provisioning & session revocation
description: How the cwsite admin account is created and how credential rotation revokes sessions
---

# Admin provisioning from secrets

The cwsite admin account is NOT self-service — there is no in-app "claim/setup" flow.
The single admin row is synced from the `ADMIN_EMAIL` + `ADMIN_PASSWORD` secrets on boot.

**Why:** password reset = change the secret + redeploy. Keeping provisioning in bootstrap
means the recovery path needs no UI and no DB access.
**How to apply:** if either secret is absent, the existing admin row is left untouched
(nothing deleted) and the login page must surface a "no admin configured" message. Both
secrets must exist in dev AND the production deployment or login silently fails there.

# Session revocation on credential rotation

Sessions are stateless 30-day JWTs. Without extra checks, rotating the password/email would
NOT log out existing cookies, so a "reset" wouldn't revoke access. The JWT therefore carries
a fingerprint of the current password hash that is re-validated against the DB on every
request; a mismatch (or missing admin) rejects the session.

**Why:** makes "change the secret + redeploy" a true reset that revokes prior sessions.
**How to apply:** any change to how the password hash is stored must keep this fingerprint
derivable from it, or all live sessions silently drop.
