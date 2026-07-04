import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { sectionTypeLabels, stackableSectionTypes } from "@/lib/sections/schemas";
import PageEditor from "../PageEditor";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const rows = await db.select().from(schema.pages).where(eq(schema.pages.id, id));
  const page = rows[0];
  if (!page) notFound();
  const sections = await db
    .select()
    .from(schema.pageSections)
    .where(eq(schema.pageSections.pageId, id))
    .orderBy(asc(schema.pageSections.position));

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href="/admin/pages" className="font-sans text-[13px] uppercase tracking-[0.14em] text-ink-muted hover:text-bronze">
          ← Pages
        </Link>
        <a
          href={page.slug === "home" ? "/" : `/${page.slug}`}
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
