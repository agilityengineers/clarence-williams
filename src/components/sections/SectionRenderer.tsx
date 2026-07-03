import type { ResolvedSection } from "@/lib/pages";
import { sectionTypeLabels } from "@/lib/sections/schemas";

/**
 * Renders the ordered section stack of a page. Stage 1 ships a styled
 * placeholder per section; Stage 2 replaces each placeholder with the
 * pixel-faithful component. Disabled sections are skipped — that is the
 * admin's per-page toggle taking effect.
 */
export default function SectionRenderer({ sections }: { sections: ResolvedSection[] }) {
  return (
    <>
      {sections
        .filter((s) => s.enabled)
        .map((s) => (
          <SectionPlaceholder key={s.id} type={s.type} />
        ))}
    </>
  );
}

const darkSections = new Set(["hero", "story", "proof", "bookCall", "authorFeatured", "resumeRequest"]);

function SectionPlaceholder({ type }: { type: ResolvedSection["type"] }) {
  const dark = darkSections.has(type);
  return (
    <section
      className={
        dark
          ? "bg-navy py-[100px] text-dark-ivory"
          : "bg-ivory py-[100px] text-ink"
      }
    >
      <div className="mx-auto max-w-[1920px] px-6 lg:px-[100px]">
        <p
          className={`eyebrow-dash font-sans text-[14px] font-semibold uppercase tracking-[0.32em] ${
            dark ? "text-gold" : "text-bronze"
          }`}
        >
          {sectionTypeLabels[type]}
        </p>
        <h2 className="mt-6 font-display text-[44px] leading-tight md:text-[64px]">
          {sectionTypeLabels[type]} section
        </h2>
        <p className={`mt-4 font-sans text-[16px] ${dark ? "text-dark-muted" : "text-ink-muted"}`}>
          Pixel-faithful build arrives in Stage 2.
        </p>
      </div>
    </section>
  );
}
