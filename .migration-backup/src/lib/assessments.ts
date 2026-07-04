import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { ensureBootstrapped } from "@/db/bootstrap";

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

export type AssessmentIntro = z.infer<typeof assessmentIntroSchema>;
export type AssessmentResultsCopy = z.infer<typeof assessmentResultsCopySchema>;

/** Everything the admin can edit about an assessment, post-launch, no code changes. */
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

export type PublicAssessment = {
  id: string;
  slug: string;
  title: string;
  active: boolean;
  intro: AssessmentIntro;
  resultsCopy: AssessmentResultsCopy;
  questions: Array<{
    id: string;
    text: string;
    options: Array<{ id: string; label: string }>;
  }>;
};

export async function listAssessments() {
  await ensureBootstrapped();
  const db = await getDb();
  return db.select().from(schema.assessments).orderBy(asc(schema.assessments.slug));
}

export async function getAssessmentBySlug(slug: string): Promise<PublicAssessment | null> {
  await ensureBootstrapped();
  const db = await getDb();
  const rows = await db.select().from(schema.assessments).where(eq(schema.assessments.slug, slug));
  const a = rows[0];
  if (!a) return null;

  const questions = await db
    .select()
    .from(schema.assessmentQuestions)
    .where(eq(schema.assessmentQuestions.assessmentId, a.id))
    .orderBy(asc(schema.assessmentQuestions.position));

  const result: PublicAssessment = {
    id: a.id,
    slug: a.slug,
    title: a.title,
    active: a.active,
    intro: assessmentIntroSchema.parse(a.intro),
    resultsCopy: assessmentResultsCopySchema.parse(a.resultsCopy),
    questions: [],
  };
  for (const q of questions) {
    const options = await db
      .select()
      .from(schema.assessmentOptions)
      .where(eq(schema.assessmentOptions.questionId, q.id))
      .orderBy(asc(schema.assessmentOptions.position));
    result.questions.push({
      id: q.id,
      text: q.text,
      // weights intentionally not exposed to the client
      options: options.map((o) => ({ id: o.id, label: o.label })),
    });
  }
  return result;
}

/**
 * Authoritative scoring, computed server-side from stored weights:
 * score = (sum of chosen option weights / maximum possible sum) × 100,
 * mapped onto the admin-defined tier ranges.
 */
export async function scoreAssessment(
  assessmentId: string,
  answerOptionIds: string[],
): Promise<{ score: number; tier: { label: string; headline: string; recommendation: string } } | null> {
  const db = await getDb();
  const questions = await db
    .select()
    .from(schema.assessmentQuestions)
    .where(eq(schema.assessmentQuestions.assessmentId, assessmentId))
    .orderBy(asc(schema.assessmentQuestions.position));
  if (questions.length === 0 || answerOptionIds.length !== questions.length) return null;

  let total = 0;
  let max = 0;
  for (let i = 0; i < questions.length; i++) {
    const options = await db
      .select()
      .from(schema.assessmentOptions)
      .where(eq(schema.assessmentOptions.questionId, questions[i].id));
    const chosen = options.find((o) => o.id === answerOptionIds[i]);
    if (!chosen) return null; // answer must belong to its question
    total += chosen.weight;
    max += Math.max(...options.map((o) => o.weight));
  }
  const score = max === 0 ? 0 : Math.round((total / max) * 100);

  const tiers = await db
    .select()
    .from(schema.assessmentTiers)
    .where(eq(schema.assessmentTiers.assessmentId, assessmentId));
  const tier =
    tiers.find((t) => score >= t.minScore && score <= t.maxScore) ??
    tiers.sort((a, b) => a.minScore - b.minScore)[0];
  if (!tier) return null;
  return {
    score,
    tier: { label: tier.label, headline: tier.headline, recommendation: tier.recommendation },
  };
}
