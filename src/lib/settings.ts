import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";

export const siteSettingsSchema = z.object({
  calendlyUrl: z.string().url(),
  contact: z.object({
    email: z.string(),
    phone: z.string(),
    address: z.string(),
  }),
  insightsDefaults: z.object({
    feedUrl: z.string().url(),
    articleCount: z.number().int().min(1).max(9),
    layout: z.enum(["Editorial List", "Card Grid", "Feature + List"]),
  }),
  metaDefaults: z.object({
    siteName: z.string(),
    titleSuffix: z.string(),
  }),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  calendlyUrl: "https://calendly.com/clarencewilliams/15min",
  contact: {
    email: "cw@clarencewilliams.com",
    phone: "(678) 831-5700",
    address: "11877 Douglas Rd, Suite 102, #328, Alpharetta, GA 30005",
  },
  insightsDefaults: {
    feedUrl: "https://ceo-advisory-group.com/newsletter/feed/rss",
    articleCount: 3,
    layout: "Editorial List",
  },
  metaDefaults: {
    siteName: "Clarence Williams",
    titleSuffix: " — Clarence Williams",
  },
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const db = await getDb();
  const rows = await db.select().from(schema.settings).where(eq(schema.settings.key, "site"));
  if (rows.length === 0) return DEFAULT_SITE_SETTINGS;
  const parsed = siteSettingsSchema.safeParse(rows[0].value);
  return parsed.success ? parsed.data : DEFAULT_SITE_SETTINGS;
}

export async function saveSiteSettings(value: SiteSettings): Promise<void> {
  const db = await getDb();
  await db
    .insert(schema.settings)
    .values({ key: "site", value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value, updatedAt: new Date() },
    });
}
