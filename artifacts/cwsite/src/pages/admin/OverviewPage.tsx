import { useEffect } from "react";
import { Link } from "wouter";
import { apiGet } from "@/lib/api";
import { useAdminQuery } from "./session";

type OverviewData = {
  pages: Array<{ slug: string; title: string; status: "draft" | "published"; id: string }>;
  newResumeRequests: number;
  newSubmissions: number;
  mediaCount: number;
};

export default function OverviewPage() {
  useEffect(() => {
    document.title = "Dashboard — Clarence Williams Admin";
  }, []);

  const { data } = useAdminQuery<OverviewData>(["admin", "overview"], () =>
    apiGet<OverviewData>("/admin/overview"),
  );

  const pages = data?.pages ?? [];
  const tiles = [
    { label: "New resume requests", value: data?.newResumeRequests ?? 0, href: "/leads" },
    { label: "New assessment leads", value: data?.newSubmissions ?? 0, href: "/leads" },
    { label: "Pages", value: pages.length, href: "/pages" },
    { label: "Media items", value: data?.mediaCount ?? 0, href: "/media" },
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
              <Link href={`/pages/${p.id}`} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-ivory-hover">
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
