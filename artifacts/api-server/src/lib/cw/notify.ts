import { getSiteSettings } from "./settings";
import { logger } from "../logger";

/**
 * Email notifications via Resend's REST API (no SDK, pure fetch).
 * Configure with RESEND_API_KEY (+ optional NOTIFY_FROM, defaults to
 * Resend's shared onboarding sender until a domain is verified).
 * Without a key, notifications are skipped — leads are always stored in
 * the database regardless, so nothing is lost.
 */
export async function notifyAdmin(subject: string, text: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.info({ subject }, "[notify] RESEND_API_KEY not set — skipped email");
    return;
  }
  try {
    const settings = await getSiteSettings();
    const to = process.env.NOTIFY_TO || settings.contact.email;
    const from = process.env.NOTIFY_FROM || "ClarenceWilliams.com <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    if (!res.ok) {
      logger.error({ status: res.status, body: await res.text() }, "[notify] Resend error response");
    }
  } catch (err) {
    logger.error({ err }, "[notify] email delivery failed");
  }
}
