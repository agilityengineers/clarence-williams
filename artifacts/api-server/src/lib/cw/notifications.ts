import { z } from "zod/v4";
import { getDb, schema } from "./db";
import { eq } from "drizzle-orm";
import { getSiteSettings } from "./settings";
import { sendEmail, type SendResult } from "./notify";
import { logger } from "../logger";

/**
 * Lead notification emails: subject + simple HTML body templates stored in
 * the settings table (key "notifications") so the admin can edit them from
 * the dashboard after publish. Placeholders like {{name}} are replaced with
 * lead data; values are HTML-escaped when injected into the HTML body.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const notificationSettingsSchema = z.object({
  /** Recipient. Empty string = fall back to the site contact email. */
  to: z
    .string()
    .trim()
    .max(320)
    .refine((v) => v === "" || EMAIL_RE.test(v), "Enter a valid email address (or leave blank)."),
  /** Sender address — must be a verified sender in SendGrid. */
  from: z
    .string()
    .trim()
    .max(320)
    .refine((v) => EMAIL_RE.test(v), "Enter a valid sender email address."),
  assessment: z.object({
    subject: z.string().min(1).max(500),
    html: z.string().min(1).max(20000),
  }),
  resume: z.object({
    subject: z.string().min(1).max(500),
    html: z.string().min(1).max(20000),
  }),
});

export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  to: "",
  from: "cw@clarencewilliams.com",
  assessment: {
    subject: "{{assessment}} lead: {{name}} scored {{score}}",
    html: [
      "<h2>New assessment lead</h2>",
      "<p>A new assessment was completed on clarencewilliams.com.</p>",
      "<p>",
      "<strong>Assessment:</strong> {{assessment}}<br>",
      "<strong>Name:</strong> {{name}}<br>",
      "<strong>Email:</strong> {{email}}<br>",
      "<strong>Phone:</strong> {{phone}}<br>",
      "<strong>Score:</strong> {{score}}/100 — {{tier}}",
      "</p>",
      "<p>This lead is also stored in the admin dashboard under Leads.</p>",
    ].join("\n"),
  },
  resume: {
    subject: "Resume request from {{name}}",
    html: [
      "<h2>New resume request</h2>",
      "<p>A new resume request was submitted on clarencewilliams.com.</p>",
      "<p>",
      "<strong>Name:</strong> {{name}}<br>",
      "<strong>Email:</strong> {{email}}<br>",
      "<strong>Company:</strong> {{company}}",
      "</p>",
      "<p><strong>Role / opportunity:</strong></p>",
      "<p>{{roleDetails}}</p>",
      "<p>This lead is also stored in the admin dashboard under Leads.</p>",
    ].join("\n"),
  },
};

/** Placeholders available per template, surfaced in the admin UI. */
export const TEMPLATE_PLACEHOLDERS: Record<LeadKind, string[]> = {
  assessment: ["{{assessment}}", "{{name}}", "{{email}}", "{{phone}}", "{{score}}", "{{tier}}"],
  resume: ["{{name}}", "{{email}}", "{{company}}", "{{roleDetails}}"],
};

export type LeadKind = "assessment" | "resume";

const SETTINGS_KEY = "notifications";

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const db = await getDb();
  const rows = await db.select().from(schema.settings).where(eq(schema.settings.key, SETTINGS_KEY));
  if (rows.length === 0) return DEFAULT_NOTIFICATION_SETTINGS;
  const parsed = notificationSettingsSchema.safeParse(rows[0].value);
  return parsed.success ? parsed.data : DEFAULT_NOTIFICATION_SETTINGS;
}

export async function saveNotificationSettings(value: NotificationSettings): Promise<void> {
  const db = await getDb();
  await db
    .insert(schema.settings)
    .values({ key: SETTINGS_KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value, updatedAt: new Date() },
    });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Replace {{key}} placeholders. HTML mode escapes values and turns newlines into <br>. */
export function renderTemplate(template: string, data: Record<string, string>, mode: "html" | "text"): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) => {
    const raw = data[key] ?? "";
    if (mode === "text") return raw;
    return escapeHtml(raw).replace(/\r?\n/g, "<br>");
  });
}

/** Crude but sufficient HTML → plain-text fallback for the email text part. */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|div|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function resolveRecipient(settings: NotificationSettings): Promise<string> {
  if (settings.to.trim()) return settings.to.trim();
  const site = await getSiteSettings();
  return site.contact.email;
}

/**
 * Render the template for a lead and send it. Never throws — a failed or
 * skipped email must not affect the visitor; the lead is already stored.
 */
export async function notifyLead(kind: LeadKind, data: Record<string, string>): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    const template = settings[kind];
    const to = await resolveRecipient(settings);
    const subject = renderTemplate(template.subject, data, "text");
    const html = renderTemplate(template.html, data, "html");
    const result = await sendEmail({ to, from: settings.from, subject, html, text: htmlToText(html) });
    if (!result.ok && !result.skipped) {
      logger.error({ kind, error: result.error }, "[notify] lead email not sent");
    }
  } catch (err) {
    logger.error({ err, kind }, "[notify] lead notification failed");
  }
}

/** Sample data used by the admin "send test email" button. */
export const SAMPLE_LEAD_DATA: Record<LeadKind, Record<string, string>> = {
  assessment: {
    assessment: "Agility Assessment",
    name: "Test Lead",
    email: "lead@example.com",
    phone: "(555) 010-2030",
    score: "82",
    tier: "Prime candidate",
  },
  resume: {
    name: "Test Recruiter",
    email: "recruiter@example.com",
    company: "Example Corp",
    roleDetails: "This is a test of the resume-request notification email.",
  },
};
