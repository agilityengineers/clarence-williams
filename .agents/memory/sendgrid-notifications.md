---
name: SendGrid notifications
description: How lead notification email is wired and its external constraints
---

- No Replit integration exists for SendGrid — a plain `SENDGRID_API_KEY` secret is used with the v3 `/mail/send` REST API via fetch.
- **Why:** searched integrations; none available. Avoids adding the sendgrid npm SDK.
- **How to apply:** the "from" address must be a verified sender (or authenticated domain) in the user's SendGrid account, or sends fail with 403. Success status is 202. When the key is unset, email is intentionally skipped and leads are still stored — treat that as info, not an error.
