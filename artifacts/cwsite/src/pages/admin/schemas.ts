import { z } from "zod/v4";

/**
 * Client-side copies of the settings and assessment editor schemas, kept in
 * sync with the server (api-server lib/cw/settings.ts and assessments.ts).
 * Used only to generate the JSON Schema that drives the admin SchemaForm.
 */

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

export const assessmentIntroSchema = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  description: z.string(),
  metaLines: z.array(z.string()).max(4),
  crossLinkText: z.string(),
});

export const assessmentResultsCopySchema = z.object({
  headline: z.string(),
  leadCapture: z.object({ title: z.string(), description: z.string() }),
});

export const assessmentEditorSchema = z.object({
  title: z.string().min(1).max(200),
  active: z.boolean(),
  intro: assessmentIntroSchema,
  resultsCopy: assessmentResultsCopySchema,
  questions: z
    .array(
      z.object({
        text: z.string().min(1),
        options: z
          .array(z.object({ label: z.string().min(1), weight: z.number().int().min(0).max(10) }))
          .min(2)
          .max(6),
      }),
    )
    .min(1)
    .max(25),
  tiers: z
    .array(
      z.object({
        minScore: z.number().int().min(0).max(100),
        maxScore: z.number().int().min(0).max(100),
        label: z.string().min(1),
        headline: z.string(),
        recommendation: z.string(),
      }),
    )
    .min(1)
    .max(8),
});

export type AssessmentEditorInput = z.infer<typeof assessmentEditorSchema>;
