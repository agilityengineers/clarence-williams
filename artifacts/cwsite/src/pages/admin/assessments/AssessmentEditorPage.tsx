import { useEffect } from "react";
import { Link } from "wouter";
import { z } from "zod/v4";
import { apiGet, assetUrl } from "@/lib/api";
import { useAdminQuery } from "../session";
import { assessmentEditorSchema, assessmentIntroSchema, assessmentResultsCopySchema } from "../schemas";
import AssessmentEditor from "./AssessmentEditor";

type AssessmentData = {
  assessment: {
    id: string;
    slug: string;
    title: string;
    active: boolean;
    intro: unknown;
    resultsCopy: unknown;
    questions: Array<{ text: string; options: Array<{ label: string; weight: number }> }>;
    tiers: Array<{
      minScore: number;
      maxScore: number;
      label: string;
      headline: string;
      recommendation: string;
    }>;
  };
};

export default function AssessmentEditorPage({ slug }: { slug: string }) {
  useEffect(() => {
    document.title = "Assessment — Admin";
  }, []);

  const { data } = useAdminQuery<AssessmentData>(["admin", "assessment", slug], () =>
    apiGet<AssessmentData>(`/admin/assessments/${slug}`),
  );

  if (!data) {
    return (
      <div>
        <Link href="/assessments" className="font-sans text-[13px] uppercase tracking-[0.14em] text-ink-muted hover:text-bronze">
          ← Assessments
        </Link>
        <p className="mt-6 font-sans text-[15px] text-ink-muted">Loading…</p>
      </div>
    );
  }

  const a = data.assessment;
  const initialValue = {
    title: a.title,
    active: a.active,
    intro: assessmentIntroSchema.parse(a.intro),
    resultsCopy: assessmentResultsCopySchema.parse(a.resultsCopy),
    questions: a.questions,
    tiers: a.tiers,
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href="/assessments" className="font-sans text-[13px] uppercase tracking-[0.14em] text-ink-muted hover:text-bronze">
          ← Assessments
        </Link>
        <a href={assetUrl(`/assessment/${a.slug}`)} target="_blank" className="font-sans text-[13px] uppercase tracking-[0.14em] text-bronze hover:underline">
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
          slug={a.slug}
          schema={z.toJSONSchema(assessmentEditorSchema) as Record<string, unknown>}
          initialValue={initialValue}
        />
      </div>
    </div>
  );
}
