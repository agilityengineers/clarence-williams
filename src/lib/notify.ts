import "server-only";
import { getSiteSettings } from "@/lib/settings";

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
    console.log(`[notify] RESEND_API_KEY not set — skipped email: ${subject}`);
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
      console.error(`[notify] Resend responded ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error("[notify] email delivery failed", err);
  }
}
