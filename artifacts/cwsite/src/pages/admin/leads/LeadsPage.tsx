import { useEffect } from "react";
import { apiGet, apiUrl } from "@/lib/api";
import { useAdminQuery } from "../session";
import LeadStatusButton from "./LeadStatusButton";

type Submission = {
  id: string;
  assessmentId: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  tierLabel: string;
  status: string;
  createdAt: string;
};

type ResumeRequest = {
  id: string;
  name: string;
  email: string;
  company: string;
  roleDetails: string;
  status: string;
  createdAt: string;
};

type AssessmentRef = { id: string; title: string };

/** Reply link with a prefilled draft so the dashboard acts like a light CRM. */
function mailtoHref(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

function assessmentMailto(s: Submission, assessmentTitle: string): string {
  return mailtoHref(
    s.email,
    `Your ${assessmentTitle} results — next steps`,
    `Hi ${firstNameOf(s.name)},\n\nThank you for completing the ${assessmentTitle}. You scored ${s.score}/100 — "${s.tierLabel}".\n\nI'd welcome a short conversation about what the results suggest for your organization. Would a 15-minute call this week work?\n\n— Clarence`,
  );
}

function resumeMailto(r: ResumeRequest): string {
  return mailtoHref(
    r.email,
    `Resume request${r.company ? ` — ${r.company}` : ""}`,
    `Hi ${firstNameOf(r.name)},\n\nThank you for reaching out${r.company ? ` about the opportunity at ${r.company}` : ""}. Please find my current resume attached.\n\n— Clarence`,
  );
}

export default function LeadsPage() {
  useEffect(() => {
    document.title = "Leads — Admin";
  }, []);

  const { data } = useAdminQuery<{
    submissions: Submission[];
    resumeRequests: ResumeRequest[];
    assessments: AssessmentRef[];
  }>(["admin", "leads"], () =>
    apiGet<{ submissions: Submission[]; resumeRequests: ResumeRequest[]; assessments: AssessmentRef[] }>(
      "/admin/leads",
    ),
  );

  const submissions = data?.submissions ?? [];
  const resume = data?.resumeRequests ?? [];
  const assessmentName = new Map((data?.assessments ?? []).map((a) => [a.id, a.title]));

  return (
    <div>
      <h1 className="font-display text-[40px] leading-tight text-ink">Leads</h1>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-[14px] font-semibold uppercase tracking-[0.2em] text-ink-secondary">
            Assessment results ({submissions.length})
          </h2>
          <a href={apiUrl("/admin/leads/export?type=assessments")} className="font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-bronze hover:underline">
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
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{assessmentName.get(s.assessmentId) ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{s.name}</td>
                  <td className="px-4 py-3"><a className="text-bronze hover:underline" href={assessmentMailto(s, assessmentName.get(s.assessmentId) ?? "assessment")}>{s.email}</a></td>
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
          <a href={apiUrl("/admin/leads/export?type=resume")} className="font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-bronze hover:underline">
            Export CSV
          </a>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {resume.map((r) => (
            <div key={r.id} className={`border border-rule-light bg-white p-5 ${r.status === "new" ? "border-l-4 border-l-bronze" : ""}`}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                <span className="font-sans text-[16px] font-semibold text-ink">{r.name}</span>
                <a className="font-sans text-[14px] text-bronze hover:underline" href={resumeMailto(r)}>{r.email}</a>
                {r.company ? <span className="font-sans text-[14px] text-ink-muted">{r.company}</span> : null}
                <span className="ml-auto font-sans text-[12px] text-ink-muted">{new Date(r.createdAt).toLocaleString()}</span>
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
