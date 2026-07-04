import { useEffect } from "react";
import { Link } from "wouter";
import { sectionTypeLabels, stackableSectionTypes } from "@/lib/sections/schemas";
import PageEditor from "./PageEditor";

export default function NewPage() {
  useEffect(() => {
    document.title = "New Page — Admin";
  }, []);

  return (
    <div>
      <Link href="/pages" className="font-sans text-[13px] uppercase tracking-[0.14em] text-ink-muted hover:text-bronze">
        ← Pages
      </Link>
      <h1 className="mt-3 font-display text-[40px] leading-tight text-ink">New page</h1>
      <div className="mt-8">
        <PageEditor
          pageId={null}
          isHome={false}
          initialMeta={{
            slug: "",
            title: "",
            metaTitle: "",
            metaDescription: "",
            status: "draft",
            showInNav: false,
            navLabel: "",
            navOrder: 50,
            includeInSitemap: true,
            footerStyle: "full",
          }}
          initialSections={[{ sectionType: "prose", enabled: true, overrides: null }]}
          sectionTypeOptions={stackableSectionTypes.map((t) => ({ value: t, label: sectionTypeLabels[t] }))}
        />
      </div>
    </div>
  );
}
