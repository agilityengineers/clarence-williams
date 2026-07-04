import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import LeadStatusButton from "./LeadStatusButton";

export const metadata: Metadata = { title: "Leads — Admin", robots: { index: false, follow: false } };

export default async function LeadsPage() {
  const db = await getDb();
  const [resume, submissions, assessments] = await Promise.all([
    db.select().from(schema.resumeRequests).orderBy(desc(schema.resumeRequests.createdAt)),
    db.select().from(schema.assessmentSubmissions).orderBy(desc(schema.assessmentSubmissions.createdAt)),
    db.select().from(schema.assessments),
  ]);
  const assessmentName = new Map(assessments.map((a) => [a.id, a.title]));

  return (
    <div>
      <h1 className="font-display text-[40px] leading-tight text-ink">Leads</h1>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-[14px] font-semibold uppercase tracking-[0.2em] text-ink-secondary">
            Assessment results ({submissions.length})
          </h2>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- CSV download, not navigation */}
          <a href="/admin/leads/export?type=assessments" className="font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-bronze hover:underline">
            Export CSV
          </a>
        </div>
        <div className="mt-4 overflow-x-auto border border-rule-light bg-white">
          <table className="w-full min-w-[820px] border-collapse font-sans text-[14px]">
            <thead>
              <tr className="border-b border-rule-light text-left text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Assessment</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className={`border-b border-rule-light last:border-b-0 ${s.status === "new" ? "bg-[#FBF7EC]" : ""}`}>
                  <td className="px-4 py-3 whitespace-nowrap">{s.createdAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3">{assessmentName.get(s.assessmentId) ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{s.name}</td>
                  <td className="px-4 py-3"><a className="text-bronze hover:underline" href={`mailto:${s.email}`}>{s.email}</a></td>
                  <td className="px-4 py-3 whitespace-nowrap">{s.phone}</td>
                  <td className="px-4 py-3 font-semibold">{s.score}</td>
                  <td className="px-4 py-3">{s.tierLabel}</td>
                  <td className="px-4 py-3">
                    <LeadStatusButton kind="assessment" id={s.id} status={s.status} />
                  </td>
                </tr>
              ))}
              {submissions.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-6 text-ink-muted">No assessment submissions yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-[14px] font-semibold uppercase tracking-[0.2em] text-ink-secondary">
            Resume requests ({resume.length})
          </h2>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- CSV download, not navigation */}
          <a href="/admin/leads/export?type=resume" className="font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-bronze hover:underline">
            Export CSV
          </a>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {resume.map((r) => (
            <div key={r.id} className={`border border-rule-light bg-white p-5 ${r.status === "new" ? "border-l-4 border-l-bronze" : ""}`}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                <span className="font-sans text-[16px] font-semibold text-ink">{r.name}</span>
                <a className="font-sans text-[14px] text-bronze hover:underline" href={`mailto:${r.email}`}>{r.email}</a>
                {r.company ? <span className="font-sans text-[14px] text-ink-muted">{r.company}</span> : null}
                <span className="ml-auto font-sans text-[12px] text-ink-muted">{r.createdAt.toLocaleString()}</span>
                <LeadStatusButton kind="resume" id={r.id} status={r.status} />
              </div>
              <p className="mt-3 whitespace-pre-wrap font-sans text-[14px] leading-[1.6] text-ink-body">{r.roleDetails}</p>
            </div>
          ))}
          {resume.length === 0 ? (
            <p className="font-sans text-[14px] text-ink-muted">No resume requests yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
