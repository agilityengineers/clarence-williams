import type { Metadata } from "next";
import Link from "next/link";
import { sectionTypeLabels, stackableSectionTypes } from "@/lib/sections/schemas";

export const metadata: Metadata = {
  title: "Section Content — Admin",
  robots: { index: false, follow: false },
};

const descriptions: Record<string, string> = {
  hero: "Name, tagline, CTAs, pillars, portrait, background theme",
  services: "Three pillars — copy, sub-lines, capability chips",
  story: "Headline, intro, three plan steps",
  about: "Quote, bio paragraphs, credentials, portrait",
  proof: "Metrics and testimonials",
  ventures: "Affiliated brand list and taglines",
  insights: "Feed URL, article count, display format (site-wide defaults)",
  bookCall: "Conversion CTA copy",
  authorFeatured: "Author page — eyebrow (book data lives under Books)",
  authorArchive: "Author page — archive band copy, group photo, Amazon link",
  resumeRequest: "Resume page — copy, credentials, form labels",
  prose: "Default content for generic prose blocks",
  footer: "Footer quote, pathway links, legal links",
};

export default function SectionsIndexPage() {
  const types = [...stackableSectionTypes, "footer" as const];
  return (
    <div>
      <h1 className="font-display text-[40px] leading-tight text-ink">Section content</h1>
      <p className="mt-2 max-w-[700px] font-sans text-[15px] text-ink-muted">
        Shared content for each section in the library. Edits apply everywhere the section is used;
        per-page placement and toggles live in the page builder.
      </p>
      <ul className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {types.map((t) => (
          <li key={t}>
            <Link
              href={`/admin/sections/${t}`}
              className="block border border-rule-light bg-white px-5 py-4 transition-colors hover:border-bronze"
            >
              <span className="font-sans text-[16px] font-semibold text-ink">{sectionTypeLabels[t]}</span>
              <span className="mt-1 block font-sans text-[13px] text-ink-muted">{descriptions[t]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
