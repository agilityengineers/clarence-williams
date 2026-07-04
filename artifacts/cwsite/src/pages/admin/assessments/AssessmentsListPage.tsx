import { useEffect } from "react";
import { Link } from "wouter";
import { apiGet } from "@/lib/api";
import { useAdminQuery } from "../session";

type AssessmentRow = { id: string; slug: string; title: string; active: boolean };

export default function AssessmentsListPage() {
  useEffect(() => {
    document.title = "Assessments — Admin";
  }, []);

  const { data } = useAdminQuery<{ assessments: AssessmentRow[] }>(["admin", "assessments"], () =>
    apiGet<{ assessments: AssessmentRow[] }>("/admin/assessments"),
  );
  const assessments = data?.assessments ?? [];

  return (
    <div>
      <h1 className="font-display text-[40px] leading-tight text-ink">Assessments</h1>
      <p className="mt-2 max-w-[700px] font-sans text-[15px] text-ink-muted">
        Two distinct instruments. Add, remove, and reorder questions; edit answer text and weights
        (0–10); and adjust result-tier ranges and copy — all changes are live immediately.
      </p>
      <ul className="mt-8 flex flex-col gap-3">
        {assessments.map((a) => (
          <li key={a.id}>
            <Link
              href={`/assessments/${a.slug}`}
              className="flex items-center justify-between border border-rule-light bg-white px-6 py-5 transition-colors hover:border-bronze"
            >
              <span>
                <span className="font-sans text-[17px] font-semibold text-ink">{a.title}</span>
                <span className="ml-4 font-sans text-[13px] text-ink-muted">/assessment/{a.slug}</span>
              </span>
              <span
                className={`px-2 py-1 font-sans text-[11px] uppercase tracking-[0.12em] ${
                  a.active ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-900"
                }`}
              >
                {a.active ? "Active" : "Disabled"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
