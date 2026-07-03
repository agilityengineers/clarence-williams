import { z } from "zod";

/**
 * One zod schema per section type in the library. These schemas are the
 * single source of truth for section content shape — the admin editors,
 * the public renderers, and the AI page API all validate against them.
 * GET /api/v1/section-schemas serves their JSON Schema form to AI tools.
 */

export const heroThemes = ["Midnight Navy", "Warm Charcoal", "Ivory", "Terracotta"] as const;

export const heroSchema = z.object({
  theme: z.enum(heroThemes),
  eyebrow: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  tagline: z.string(),
  primaryCta: z.object({ label: z.string() }),
  secondaryCta: z.object({ label: z.string(), href: z.string() }),
  pillars: z.array(z.object({ title: z.string(), subtitle: z.string() })).length(3),
  portraitMediaId: z.string().nullable(),
  portraitCaption: z.string(),
});

export const servicesSchema = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  // Fixed order per brand rules: 1. Business Consulting, 2. Software Delivery
  // Leadership, 3. Brand & Marketing. The admin edits copy within each pillar.
  pillars: z
    .array(
      z.object({
        title: z.string(),
        subline: z.string(),
        body: z.string(),
        chips: z.array(z.string()).max(3),
      }),
    )
    .length(3),
});

export const storySchema = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  intro: z.string(),
  steps: z.array(z.object({ title: z.string(), body: z.string() })).length(3),
});

export const aboutSchema = z.object({
  eyebrow: z.string(),
  locationLine: z.string(),
  quoteHeadline: z.string(),
  bioParagraphs: z.array(z.string()).min(1).max(4),
  credentials: z.array(z.object({ title: z.string(), detail: z.string() })).length(4),
  portraitMediaId: z.string().nullable(),
});

export const proofSchema = z.object({
  eyebrow: z.string(),
  metrics: z
    .array(z.object({ value: z.string(), label: z.string(), body: z.string() }))
    .min(1)
    .max(4),
  testimonials: z
    .array(z.object({ quote: z.string(), attribution: z.string() }))
    .min(1)
    .max(6),
});

export const venturesSchema = z.object({
  eyebrow: z.string(),
  brands: z
    .array(z.object({ name: z.string(), tagline: z.string(), url: z.string() }))
    .min(1)
    .max(8),
  disclaimer: z.string(),
});

export const insightsLayouts = ["Editorial List", "Card Grid", "Feature + List"] as const;

export const insightsSchema = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  feedUrl: z.string(),
  articleCount: z.number().int().min(1).max(9),
  layout: z.enum(insightsLayouts),
});

export const bookCallSchema = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  note: z.string(),
  primaryCta: z.object({ label: z.string() }), // href always comes from the admin Calendly setting
  secondaryCta: z.object({ label: z.string(), href: z.string() }),
});

/**
 * Global footer — rendered on every page (Pages = Nav + sections + Footer).
 * Contact details come from site settings; this holds the editorial copy.
 */
export const footerSchema = z.object({
  quote: z.string(),
  pathways: z.array(z.object({ label: z.string(), href: z.string() })).max(6),
  contactNote: z.string(),
  legalLinks: z.array(z.object({ label: z.string(), href: z.string() })).max(4),
});

export const authorFeaturedSchema = z.object({
  eyebrow: z.string(),
  intro: z.string(),
});

export const authorArchiveSchema = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  blurb: z.string(),
  groupPhotoMediaId: z.string().nullable(),
  amazonUrl: z.string(),
});

export const resumeRequestSchema = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  credentialLines: z.array(z.string()).max(5),
  formTitle: z.string(),
  confirmationTitle: z.string(),
  confirmationBody: z.string(),
});

/** Generic rich-text/prose block available to the page builder and AI API. */
export const proseSchema = z.object({
  background: z.enum(["navy", "ivory"]),
  eyebrow: z.string(),
  headline: z.string(),
  /** Paragraphs of plain text (rendered with typographic styling). */
  paragraphs: z.array(z.string()),
});

export const sectionSchemas = {
  hero: heroSchema,
  services: servicesSchema,
  story: storySchema,
  about: aboutSchema,
  proof: proofSchema,
  ventures: venturesSchema,
  insights: insightsSchema,
  bookCall: bookCallSchema,
  authorFeatured: authorFeaturedSchema,
  authorArchive: authorArchiveSchema,
  resumeRequest: resumeRequestSchema,
  prose: proseSchema,
  footer: footerSchema,
} as const;

export type SectionType = keyof typeof sectionSchemas;

export type SectionContentMap = {
  [K in SectionType]: z.infer<(typeof sectionSchemas)[K]>;
};

export const sectionTypeLabels: Record<SectionType, string> = {
  hero: "Hero",
  services: "Services",
  story: "Your Brand's Story",
  about: "About",
  proof: "Proof",
  ventures: "Affiliated Ventures",
  insights: "Executive Insights (RSS)",
  bookCall: "Book a Call + Footer",
  authorFeatured: "Author — Featured Book",
  authorArchive: "Author — From the Archive",
  resumeRequest: "Resume Request Form",
  prose: "Prose Block",
  footer: "Global Footer",
};

/** Section types the page builder offers (footer is global, not stackable). */
export const stackableSectionTypes = (Object.keys(sectionSchemas) as SectionType[]).filter(
  (t) => t !== "footer",
);
