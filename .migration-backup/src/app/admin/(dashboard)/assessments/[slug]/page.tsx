import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import {
  assessmentEditorSchema,
  assessmentIntroSchema,
  assessmentResultsCopySchema,
} from "@/lib/assessments";
import AssessmentEditor from "./AssessmentEditor";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AssessmentEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = await getDb();
  const rows = await db.select().from(schema.assessments).where(eq(schema.assessments.slug, slug));
  const a = rows[0];
  if (!a) notFound();

  const questions = await db
    .select()
    .from(schema.assessmentQuestions)
    .where(eq(schema.assessmentQuestions.assessmentId, a.id))
    .orderBy(asc(schema.assessmentQuestions.position));
  const editorQuestions = [];
  for (const q of questions) {
    const options = await db
      .select()
      .from(schema.assessmentOptions)
      .where(eq(schema.assessmentOptions.questionId, q.id))
      .orderBy(asc(schema.assessmentOptions.position));
    editorQuestions.push({
      text: q.text,
      options: options.map((o) => ({ label: o.label, weight: o.weight })),
    });
  }
  const tiers = await db
    .select()
    .from(schema.assessmentTiers)
    .where(eq(schema.assessmentTiers.assessmentId, a.id));

  const initialValue = {
    title: a.title,
    active: a.active,
    intro: assessmentIntroSchema.parse(a.intro),
    resultsCopy: assessmentResultsCopySchema.parse(a.resultsCopy),
    questions: editorQuestions,
    tiers: tiers
      .sort((x, y) => y.minScore - x.minScore)
      .map((t) => ({
        minScore: t.minScore,
        maxScore: t.maxScore,
        label: t.label,
        headline: t.headline,
        recommendation: t.recommendation,
      })),
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href="/admin/assessments" className="font-sans text-[13px] uppercase tracking-[0.14em] text-ink-muted hover:text-bronze">
          ← Assessments
        </Link>
        <a href={`/assessment/${a.slug}`} target="_blank" className="font-sans text-[13px] uppercase tracking-[0.14em] text-bronze hover:underline">
          View live ↗
        </a>
      </div>
      <h1 className="mt-3 font-display text-[40px] leading-tight text-ink">{a.title}</h1>
      <p className="mt-2 max-w-[740px] font-sans text-[14px] text-ink-muted">
        Scoring: each answer carries a weight (0–10). A visitor&rsquo;s score is the sum of chosen
        weights divided by the maximum possible, times 100. Tiers map score ranges to the result
        headline and recommendation shown on the results screen.
      </p>
      <div className="mt-8 max-w-[900px]">
        <AssessmentEditor
          assessmentId={a.id}
          schema={z.toJSONSchema(assessmentEditorSchema) as Record<string, unknown>}
          initialValue={initialValue}
        />
      </div>
    </div>
  );
}
