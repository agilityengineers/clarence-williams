import type { Metadata } from "next";
import { getDb, schema } from "@/db";

export const metadata: Metadata = {
  title: "Dashboard — Clarence Williams Admin",
  robots: { index: false, follow: false },
};

const upcoming = [
  { title: "Pages & Page Builder", stage: "Stage 3" },
  { title: "Section Content Editors", stage: "Stage 3" },
  { title: "Hero Theme & Imagery", stage: "Stage 3" },
  { title: "Media Library", stage: "Stage 3" },
  { title: "Settings (Calendly, Contact)", stage: "Stage 3" },
  { title: "Assessment Editor", stage: "Stage 4" },
  { title: "Leads Inbox", stage: "Stage 4" },
  { title: "Insights / RSS Settings", stage: "Stage 5" },
  { title: "API Keys (AI Pages)", stage: "Stage 6" },
];

export default async function AdminDashboardPage() {
  const db = await getDb();
  const pages = await db
    .select({ slug: schema.pages.slug, title: schema.pages.title, status: schema.pages.status })
    .from(schema.pages);

  return (
    <div>
      <p className="eyebrow-dash font-sans text-[13px] font-semibold uppercase tracking-[0.32em] text-bronze">
        Dashboard
      </p>
      <h1 className="mt-4 font-display text-[48px] leading-tight text-ink">
        Welcome back, <span className="italic text-bronze">Clarence</span>.
      </h1>

      <section className="mt-12">
        <h2 className="font-sans text-[14px] font-semibold uppercase tracking-[0.2em] text-ink-secondary">
          Site pages
        </h2>
        <ul className="mt-4 divide-y divide-rule-light border border-rule-light bg-white">
          {pages.map((p) => (
            <li key={p.slug} className="flex items-center justify-between px-6 py-4">
              <span className="font-sans text-[16px] text-ink-body">{p.title}</span>
              <span className="font-sans text-[12px] uppercase tracking-[0.14em] text-ink-muted">
                /{p.slug === "home" ? "" : p.slug} · {p.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-sans text-[14px] font-semibold uppercase tracking-[0.2em] text-ink-secondary">
          Coming in later stages
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((item) => (
            <li key={item.title} className="border border-rule-light bg-white px-5 py-4">
              <p className="font-sans text-[15px] text-ink-body">{item.title}</p>
              <p className="mt-1 font-sans text-[12px] uppercase tracking-[0.14em] text-ink-faint">
                {item.stage}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
