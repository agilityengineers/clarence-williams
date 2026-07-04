import { useEffect } from "react";
import { Link } from "wouter";
import { apiGet, assetUrl } from "@/lib/api";
import { sectionTypeLabels, stackableSectionTypes } from "@/lib/sections/schemas";
import { useAdminQuery } from "../session";
import PageEditor from "./PageEditor";

type PageData = {
  page: {
    id: string;
    slug: string;
    title: string;
    metaTitle: string;
    metaDescription: string;
    status: "draft" | "published";
    showInNav: boolean;
    navLabel: string | null;
    navOrder: number;
    includeInSitemap: boolean;
    footerStyle: "full" | "slim";
    createdBy: "admin" | "api";
  };
  sections: Array<{
    sectionType: string;
    enabled: boolean;
    overrides: Record<string, unknown> | null;
  }>;
};

export default function EditPage({ id }: { id: string }) {
  useEffect(() => {
    document.title = "Edit Page — Admin";
  }, []);

  const { data } = useAdminQuery<PageData>(["admin", "page", id], () =>
    apiGet<PageData>(`/admin/pages/${id}`),
  );

  if (!data) {
    return (
      <div>
        <Link href="/pages" className="font-sans text-[13px] uppercase tracking-[0.14em] text-ink-muted hover:text-bronze">
          ← Pages
        </Link>
        <p className="mt-6 font-sans text-[15px] text-ink-muted">Loading…</p>
      </div>
    );
  }

  const { page, sections } = data;

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href="/pages" className="font-sans text-[13px] uppercase tracking-[0.14em] text-ink-muted hover:text-bronze">
          ← Pages
        </Link>
        <a
          href={page.slug === "home" ? assetUrl("/") : assetUrl(`/${page.slug}`)}
          target="_blank"
          className="font-sans text-[13px] uppercase tracking-[0.14em] text-bronze hover:underline"
        >
          View page ↗
        </a>
      </div>
      <h1 className="mt-3 font-display text-[40px] leading-tight text-ink">
        Edit: {page.title}
        {page.createdBy === "api" ? (
          <span className="ml-4 align-middle font-sans text-[11px] uppercase tracking-[0.12em] text-[#7A5A1E]">
            AI-created
          </span>
        ) : null}
      </h1>
      <div className="mt-8">
        <PageEditor
          pageId={page.id}
          isHome={page.slug === "home"}
          initialMeta={{
            slug: page.slug,
            title: page.title,
            metaTitle: page.metaTitle,
            metaDescription: page.metaDescription,
            status: page.status,
            showInNav: page.showInNav,
            navLabel: page.navLabel ?? "",
            navOrder: page.navOrder,
            includeInSitemap: page.includeInSitemap,
            footerStyle: page.footerStyle,
          }}
          initialSections={sections.map((s) => ({
            sectionType: s.sectionType,
            enabled: s.enabled,
            overrides: (s.overrides as Record<string, unknown> | null) ?? null,
          }))}
          sectionTypeOptions={stackableSectionTypes.map((t) => ({ value: t, label: sectionTypeLabels[t] }))}
        />
      </div>
    </div>
  );
}
