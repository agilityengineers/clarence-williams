import type { Metadata } from "next";
import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export const metadata: Metadata = {
  title: "Dashboard — Clarence Williams Admin",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const db = await getDb();
  const [pages, newResume, newSubmissions, mediaCount] = await Promise.all([
    db.select({ slug: schema.pages.slug, title: schema.pages.title, status: schema.pages.status, id: schema.pages.id }).from(schema.pages),
    db.select({ n: count() }).from(schema.resumeRequests).where(eq(schema.resumeRequests.status, "new")),
    db.select({ n: count() }).from(schema.assessmentSubmissions).where(eq(schema.assessmentSubmissions.status, "new")),
    db.select({ n: count() }).from(schema.media),
  ]);

  const tiles = [
    { label: "New resume requests", value: newResume[0].n, href: "/admin/leads" },
    { label: "New assessment leads", value: newSubmissions[0].n, href: "/admin/leads" },
    { label: "Pages", value: pages.length, href: "/admin/pages" },
    { label: "Media items", value: mediaCount[0].n, href: "/admin/media" },
  ];

  return (
    <div>
      <p className="eyebrow-dash font-sans text-[13px] font-semibold uppercase tracking-[0.32em] text-bronze">
        Dashboard
      </p>
      <h1 className="mt-4 font-display text-[48px] leading-tight text-ink">
        Welcome back, <span className="italic text-bronze">Clarence</span>.
      </h1>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="border border-rule-light bg-white px-6 py-5 transition-colors hover:border-bronze">
            <span className="font-display text-[44px] leading-none text-bronze">{t.value}</span>
            <span className="mt-2 block font-sans text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-secondary">
              {t.label}
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="font-sans text-[14px] font-semibold uppercase tracking-[0.2em] text-ink-secondary">
          Site pages
        </h2>
        <ul className="mt-4 divide-y divide-rule-light border border-rule-light bg-white">
          {pages.map((p) => (
            <li key={p.slug}>
              <Link href={`/admin/pages/${p.id}`} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-ivory-hover">
                <span className="font-sans text-[16px] text-ink-body">{p.title}</span>
                <span className="font-sans text-[12px] uppercase tracking-[0.14em] text-ink-muted">
                  /{p.slug === "home" ? "" : p.slug} · {p.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
