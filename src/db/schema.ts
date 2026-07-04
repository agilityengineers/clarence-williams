import {
  boolean,
  customType,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

function id() {
  return text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
}

/** Single admin account (Clarence). Created via first-run setup at /admin/setup. */
export const adminUsers = pgTable("admin_users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Internal key-value store (auto-generated auth secret, bookkeeping flags). */
export const kv = pgTable("kv", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/**
 * Site-wide admin settings, one JSON document per key:
 * "site" -> { calendlyUrl, contact{email,phone,address}, metaDefaults{...}, insightsDefaults{feedUrl,count,layout} }
 */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Shared content for each section type in the library (hero, services, story,
 * about, proof, ventures, insights, bookCall, authorFeatured, authorArchive,
 * resumeRequest). One row per type; the JSON shape is validated by the zod
 * schema registered for that type in src/lib/sections.
 */
export const sectionContent = pgTable("section_content", {
  type: text("type").primaryKey(),
  content: jsonb("content").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Uploaded images, stored in-database so Replit's ephemeral filesystem never loses them. */
export const media = pgTable("media", {
  id: id(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  alt: text("alt").notNull().default(""),
  width: integer("width"),
  height: integer("height"),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Pages-as-data. A page = nav + ordered stack of sections + footer.
 * Admin-built and API-built (AI) pages share this exact shape.
 */
export const pages = pgTable(
  "pages",
  {
    id: id(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    metaTitle: text("meta_title").notNull().default(""),
    metaDescription: text("meta_description").notNull().default(""),
    ogImageId: text("og_image_id"),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
    showInNav: boolean("show_in_nav").notNull().default(false),
    navLabel: text("nav_label"),
    navOrder: integer("nav_order").notNull().default(0),
    includeInSitemap: boolean("include_in_sitemap").notNull().default(true),
    footerStyle: text("footer_style", { enum: ["full", "slim"] }).notNull().default("full"),
    createdBy: text("created_by", { enum: ["admin", "api"] }).notNull().default("admin"),
    jsonLd: jsonb("json_ld"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("pages_slug_idx").on(t.slug)],
);

/** Ordered section instances on a page, with the per-page enable toggle and per-placement overrides. */
export const pageSections = pgTable("page_sections", {
  id: id(),
  pageId: text("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  sectionType: text("section_type").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  /** Optional per-placement props (e.g. insights layout/count for this page only, or full content override for API-built pages). */
  overrides: jsonb("overrides"),
});

/** The two assessment instruments. Everything below is admin-editable post-launch. */
export const assessments = pgTable("assessments", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  active: boolean("active").notNull().default(true),
  /** { eyebrow, headline, description, metaLines[], crossLinkText } */
  intro: jsonb("intro").notNull(),
  /** { headline, leadCapture{title, description} } */
  resultsCopy: jsonb("results_copy").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assessmentQuestions = pgTable("assessment_questions", {
  id: id(),
  assessmentId: text("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  text: text("text").notNull(),
});

export const assessmentOptions = pgTable("assessment_options", {
  id: id(),
  questionId: text("question_id")
    .notNull()
    .references(() => assessmentQuestions.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  label: text("label").notNull(),
  /** 0–10; score = sum(chosen) / sum(max per question) * 100 */
  weight: integer("weight").notNull().default(0),
});

export const assessmentTiers = pgTable("assessment_tiers", {
  id: id(),
  assessmentId: text("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  minScore: integer("min_score").notNull(),
  maxScore: integer("max_score").notNull(),
  label: text("label").notNull(),
  headline: text("headline").notNull(),
  recommendation: text("recommendation").notNull(),
});

/** Completed assessments — leads. Name/email/phone are required before results are shown. */
export const assessmentSubmissions = pgTable("assessment_submissions", {
  id: id(),
  assessmentId: text("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  answers: jsonb("answers").notNull(),
  score: integer("score").notNull(),
  tierLabel: text("tier_label").notNull(),
  status: text("status", { enum: ["new", "handled"] }).notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Resume-request leads from the unlinked Resume page. */
export const resumeRequests = pgTable("resume_requests", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull().default(""),
  roleDetails: text("role_details").notNull(),
  status: text("status", { enum: ["new", "replied"] }).notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Books for the Author page. The featured book is the row with featured=true; the rest belong to the archive group. */
export const books = pgTable("books", {
  id: id(),
  title: text("title").notNull(),
  blurb: text("blurb").notNull().default(""),
  coverMediaId: text("cover_media_id"),
  primaryUrl: text("primary_url").notNull().default(""),
  amazonUrl: text("amazon_url").notNull().default(""),
  featured: boolean("featured").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Server-side RSS cache for the Insights section. */
export const rssCache = pgTable("rss_cache", {
  feedUrl: text("feed_url").primaryKey(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  items: jsonb("items").notNull(),
});

/** Bearer tokens for the AI page-creation API. Only the SHA-256 hash is stored. */
export const apiKeys = pgTable("api_keys", {
  id: id(),
  label: text("label").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});
