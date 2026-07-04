import { useEffect } from "react";
import { Link } from "wouter";
import { apiGet } from "@/lib/api";
import { useAdminQuery } from "../session";

type PageRow = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  showInNav: boolean;
  includeInSitemap: boolean;
  createdBy: "admin" | "api";
};

export default function PagesListPage() {
  useEffect(() => {
    document.title = "Pages — Admin";
  }, []);

  const { data } = useAdminQuery<{ pages: PageRow[] }>(["admin", "pages"], () =>
    apiGet<{ pages: PageRow[] }>("/admin/pages"),
  );
  const pages = data?.pages ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[40px] leading-tight text-ink">Pages</h1>
        <Link
          href="/pages/new"
          className="bg-ink px-6 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-ivory transition-opacity hover:opacity-90"
        >
          + New Page
        </Link>
      </div>
      <p className="mt-2 max-w-[700px] font-sans text-[15px] text-ink-muted">
        Every page is a nav + ordered stack of sections + footer. Pages created by the AI API appear
        here too and are fully editable.
      </p>
      <ul className="mt-8 divide-y divide-rule-light border border-rule-light bg-white">
        {pages.map((p) => (
          <li key={p.id}>
            <Link href={`/pages/${p.id}`} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-ivory-hover">
              <span className="flex items-center gap-4">
                <span className="font-sans text-[16px] font-semibold text-ink">{p.title}</span>
                <span className="font-sans text-[13px] text-ink-muted">/{p.slug === "home" ? "" : p.slug}</span>
              </span>
              <span className="flex items-center gap-3 font-sans text-[11px] uppercase tracking-[0.12em]">
                {p.createdBy === "api" ? <Badge tone="gold">AI-created</Badge> : null}
                {p.showInNav ? <Badge tone="plain">In nav</Badge> : <Badge tone="plain">Unlinked</Badge>}
                {!p.includeInSitemap ? <Badge tone="plain">No sitemap</Badge> : null}
                <Badge tone={p.status === "published" ? "green" : "amber"}>{p.status}</Badge>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "green" | "amber" | "gold" | "plain" }) {
  const cls =
    tone === "green"
      ? "bg-green-100 text-green-900"
      : tone === "amber"
        ? "bg-amber-100 text-amber-900"
        : tone === "gold"
          ? "bg-[#F1E5C9] text-[#7A5A1E]"
          : "bg-ivory text-ink-muted border border-rule-light";
  return <span className={`px-2 py-1 ${cls}`}>{children}</span>;
}
