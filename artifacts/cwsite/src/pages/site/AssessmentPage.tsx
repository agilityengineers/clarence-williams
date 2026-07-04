import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import NotFound from "@/pages/not-found";
import { apiGet, ApiError } from "@/lib/api";
import { applyPageMeta } from "@/lib/head";
import { useLayoutData } from "@/lib/layout";
import AssessmentFlow, { type PublicAssessment } from "./AssessmentFlow";

// The two assessment instruments cross-link to each other. There is no public
// endpoint that lists assessments, so the pairing is derived from the known
// slugs (see seedAssessments in the api-server bootstrap).
const OTHER_SLUG: Record<string, string> = {
  agility: "business-health",
  "business-health": "agility",
};

export default function AssessmentPage({ slug }: { slug: string }) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["assessment", slug],
    queryFn: () => apiGet<{ assessment: PublicAssessment }>("/public/assessments/" + slug),
    retry: false,
  });
  const layout = useLayoutData();
  const calendlyUrl = layout.data?.settings.calendlyUrl ?? "";

  const assessment = data?.assessment ?? null;

  useEffect(() => {
    if (!assessment) return;
    applyPageMeta({
      title: `${assessment.title} — Clarence Williams`,
      description: assessment.intro.description || undefined,
    });
  }, [assessment]);

  if (error) {
    if (error instanceof ApiError && error.status === 404) return <NotFound />;
    return <NotFound />;
  }

  if (isLoading || !assessment) {
    return (
      <>
        <SiteNav />
        <main className="flex flex-1 flex-col" />
        <SiteFooter variant="slim" />
      </>
    );
  }

  const otherSlug = OTHER_SLUG[slug];
  const otherHref = otherSlug ? `/assessment/${otherSlug}` : null;

  return (
    <>
      <SiteNav />
      <main className="flex flex-1 flex-col">
        <AssessmentFlow assessment={assessment} otherHref={otherHref} calendlyUrl={calendlyUrl} />
      </main>
      <SiteFooter variant="slim" />
    </>
  );
}
