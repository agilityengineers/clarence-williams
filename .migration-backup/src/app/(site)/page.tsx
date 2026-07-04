import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import SectionRenderer from "@/components/sections/SectionRenderer";
import { getPublishedPage } from "@/lib/pages";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage("home");
  if (!page) return {};
  return { title: page.metaTitle, description: page.metaDescription };
}

export default async function HomePage() {
  const page = await getPublishedPage("home");
  if (!page) notFound();
  return (
    <>
      <SiteNav activeSlug="home" />
      <main className="flex flex-1 flex-col">
        <SectionRenderer sections={page.sections} />
      </main>
      <SiteFooter variant={page.footerStyle} />
    </>
  );
}
