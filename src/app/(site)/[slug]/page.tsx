import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SectionRenderer from "@/components/sections/SectionRenderer";
import { getPublishedPage } from "@/lib/pages";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) return {};
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription,
  };
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params;
  if (slug === "home") notFound(); // home is served at "/"
  const page = await getPublishedPage(slug);
  if (!page) notFound();
  return (
    <>
      <SiteNav activeSlug={page.slug} />
      <main>
        <SectionRenderer sections={page.sections} />
      </main>
      {page.jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(page.jsonLd) }}
        />
      ) : null}
    </>
  );
}
