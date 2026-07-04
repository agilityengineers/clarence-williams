import { logger } from "../logger";

/**
 * Email transport via SendGrid's v3 Mail Send API (no SDK, pure fetch).
 * Configure with the SENDGRID_API_KEY secret. Without a key, sends are
 * skipped — leads are always stored in the database regardless, so nothing
 * is lost. The sender address must be a verified sender in SendGrid.
 */

export type SendResult = { ok: true } | { ok: false; error: string; skipped?: boolean };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SENDGRID_API_KEY);
}

export async function sendEmail(input: {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    logger.info({ subject: input.subject }, "[notify] SENDGRID_API_KEY not set — skipped email");
    return { ok: false, error: "SendGrid is not configured (SENDGRID_API_KEY is not set).", skipped: true };
  }
  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: input.to }] }],
        from: { email: input.from },
        subject: input.subject,
        content: [
          { type: "text/plain", value: input.text },
          { type: "text/html", value: input.html },
        ],
      }),
    });
    if (res.ok) return { ok: true }; // SendGrid returns 202 on success
    const body = await res.text();
    logger.error({ status: res.status, body }, "[notify] SendGrid error response");
    let detail = `SendGrid rejected the send (HTTP ${res.status}).`;
    try {
      const parsed = JSON.parse(body) as { errors?: Array<{ message?: string }> };
      const first = parsed.errors?.[0]?.message;
      if (first) detail = `SendGrid: ${first}`;
    } catch {
      // keep the generic detail
    }
    return { ok: false, error: detail };
  } catch (err) {
    logger.error({ err }, "[notify] email delivery failed");
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    return { ok: false, error: timedOut ? "SendGrid did not respond in time." : "Could not reach SendGrid." };
  }
}
