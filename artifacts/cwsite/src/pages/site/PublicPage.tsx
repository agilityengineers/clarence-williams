import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import SectionRenderer from "@/components/sections/SectionRenderer";
import NotFound from "@/pages/not-found";
import { apiGet, apiUrl, ApiError } from "@/lib/api";
import { applyPageMeta } from "@/lib/head";
import type { ResolvedPage } from "@/lib/types";

/**
 * Section types whose component already renders a visible page-level <h1>
 * (hero, the author page's featured-book intro, and the resume request
 * form). When a page includes one of these, PublicPage must NOT also emit
 * its own <h1> — that would leave two on the same document.
 */
const SECTIONS_WITH_OWN_H1 = new Set(["hero", "authorFeatured", "resumeRequest"]);

export default function PublicPage({ slug }: { slug: string }) {
  const [location] = useLocation();

  const { data, error, isLoading } = useQuery({
    queryKey: ["page", slug],
    queryFn: () => apiGet<{ page: ResolvedPage }>("/public/pages/" + slug),
    retry: false,
    // "home" is served only at "/", so don't fetch it for a literal /home URL.
    enabled: !(slug === "home" && location !== "/"),
  });

  const page = data?.page ?? null;

  useEffect(() => {
    if (!page) return;
    applyPageMeta({
      title: page.metaTitle || page.title,
      description: page.metaDescription || undefined,
      ogImage: page.ogImageId
        ? new URL(apiUrl(`/media/${page.ogImageId}`), window.location.origin).toString()
        : undefined,
    });
  }, [page]);

  // home is served at "/"; a literal /home request 404s like the original.
  if (slug === "home" && location !== "/") {
    return <NotFound />;
  }

  if (error) {
    if (error instanceof ApiError && error.status === 404) {
      return <NotFound />;
    }
    return <NotFound />;
  }

  if (isLoading || !page) {
    return (
      <>
        <SiteNav activeSlug={slug} />
        <main className="flex flex-1 flex-col" />
        <SiteFooter />
      </>
    );
  }

  const hasOwnH1 = page.sections.some((s) => s.enabled && SECTIONS_WITH_OWN_H1.has(s.type));

  return (
    <>
      <SiteNav activeSlug={page.slug} />
      <main className="flex flex-1 flex-col">
        {!hasOwnH1 ? <h1 className="sr-only">{page.title}</h1> : null}
        <SectionRenderer sections={page.sections} />
      </main>
      <SiteFooter variant={page.footerStyle} />
      {page.jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(page.jsonLd) }}
        />
      ) : null}
    </>
  );
}
