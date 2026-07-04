import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import { getAssessmentBySlug, listAssessments } from "@/lib/assessments";
import { getSiteSettings } from "@/lib/settings";
import AssessmentFlow from "./AssessmentFlow";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const assessment = await getAssessmentBySlug(slug);
  if (!assessment) return {};
  return {
    title: `${assessment.title} — Clarence Williams`,
    description: assessment.intro.description,
  };
}

export default async function AssessmentPage({ params }: Props) {
  const { slug } = await params;
  const [assessment, all, settings] = await Promise.all([
    getAssessmentBySlug(slug),
    listAssessments(),
    getSiteSettings(),
  ]);
  if (!assessment || !assessment.active) notFound();
  const other = all.find((a) => a.slug !== slug && a.active);

  return (
    <>
      <SiteNav />
      <main className="flex flex-1 flex-col">
        <AssessmentFlow
          assessment={assessment}
          otherHref={other ? `/assessment/${other.slug}` : null}
          calendlyUrl={settings.calendlyUrl}
        />
      </main>
      <SiteFooter variant="slim" />
    </>
  );
}
