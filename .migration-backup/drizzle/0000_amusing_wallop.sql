CREATE TABLE "admin_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "api_keys_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "assessment_options" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"position" integer NOT NULL,
	"label" text NOT NULL,
	"weight" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"assessment_id" text NOT NULL,
	"position" integer NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"assessment_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"answers" jsonb NOT NULL,
	"score" integer NOT NULL,
	"tier_label" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"assessment_id" text NOT NULL,
	"min_score" integer NOT NULL,
	"max_score" integer NOT NULL,
	"label" text NOT NULL,
	"headline" text NOT NULL,
	"recommendation" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"intro" jsonb NOT NULL,
	"results_copy" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"blurb" text DEFAULT '' NOT NULL,
	"cover_media_id" text,
	"primary_url" text DEFAULT '' NOT NULL,
	"amazon_url" text DEFAULT '' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kv" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"width" integer,
	"height" integer,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"page_id" text NOT NULL,
	"position" integer NOT NULL,
	"section_type" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"overrides" jsonb
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"meta_title" text DEFAULT '' NOT NULL,
	"meta_description" text DEFAULT '' NOT NULL,
	"og_image_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"show_in_nav" boolean DEFAULT false NOT NULL,
	"nav_label" text,
	"nav_order" integer DEFAULT 0 NOT NULL,
	"include_in_sitemap" boolean DEFAULT true NOT NULL,
	"created_by" text DEFAULT 'admin' NOT NULL,
	"json_ld" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resume_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"role_details" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rss_cache" (
	"feed_url" text PRIMARY KEY NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"items" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "section_content" (
	"type" text PRIMARY KEY NOT NULL,
	"content" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessment_options" ADD CONSTRAINT "assessment_options_question_id_assessment_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."assessment_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_submissions" ADD CONSTRAINT "assessment_submissions_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_tiers" ADD CONSTRAINT "assessment_tiers_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");