import type { ResolvedSection } from "@/lib/types";
import type { SectionContentMap } from "@/lib/sections/schemas";
import AboutSection from "./AboutSection";
import AuthorFeaturedSection, { AuthorArchiveSection } from "./AuthorSections";
import BookCallSection from "./BookCallSection";
import HeroSection from "./HeroSection";
import InsightsSection from "./InsightsSection";
import ProofSection from "./ProofSection";
import ProseSection from "./ProseSection";
import ResumeRequestSection from "./ResumeRequestSection";
import ServicesSection from "./ServicesSection";
import StorySection from "./StorySection";
import VenturesSection from "./VenturesSection";

/**
 * Renders a page's ordered section stack. Disabled sections are skipped —
 * that is the admin's per-page toggle taking effect.
 */
export default function SectionRenderer({ sections }: { sections: ResolvedSection[] }) {
  return (
    <>
      {sections
        .filter((s) => s.enabled)
        .map((s) => (
          <Section key={s.id} section={s} />
        ))}
    </>
  );
}

function Section({ section }: { section: ResolvedSection }) {
  const c = section.content;
  switch (section.type) {
    case "hero":
      return <HeroSection content={c as SectionContentMap["hero"]} />;
    case "services":
      return <ServicesSection content={c as SectionContentMap["services"]} />;
    case "story":
      return <StorySection content={c as SectionContentMap["story"]} />;
    case "about":
      return <AboutSection content={c as SectionContentMap["about"]} />;
    case "proof":
      return <ProofSection content={c as SectionContentMap["proof"]} />;
    case "ventures":
      return <VenturesSection content={c as SectionContentMap["ventures"]} />;
    case "insights":
      return <InsightsSection content={c as SectionContentMap["insights"]} />;
    case "bookCall":
      return <BookCallSection content={c as SectionContentMap["bookCall"]} />;
    case "authorFeatured":
      return <AuthorFeaturedSection content={c as SectionContentMap["authorFeatured"]} />;
    case "authorArchive":
      return <AuthorArchiveSection content={c as SectionContentMap["authorArchive"]} />;
    case "resumeRequest":
      return <ResumeRequestSection content={c as SectionContentMap["resumeRequest"]} />;
    case "prose":
      return <ProseSection content={c as SectionContentMap["prose"]} />;
    default:
      return null;
  }
}
