import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSectionContentMap } from "@/lib/pages";
import { getSectionJsonSchemas } from "@/lib/sections/jsonschema";
import { defaultSectionContent } from "@/lib/sections/defaults";
import { sectionSchemas, sectionTypeLabels, type SectionType } from "@/lib/sections/schemas";
import { listMedia } from "../../actions";
import SectionContentEditor from "./SectionContentEditor";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function SectionEditorPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!(type in sectionSchemas)) notFound();
  const sectionType = type as SectionType;

  const [contentMap, media] = await Promise.all([getSectionContentMap(), listMedia()]);
  const parsed = sectionSchemas[sectionType].safeParse(contentMap[sectionType]);
  const value = parsed.success ? parsed.data : defaultSectionContent[sectionType];
  const jsonSchema = getSectionJsonSchemas()[sectionType].schema;

  return (
    <div>
      <Link href="/admin/sections" className="font-sans text-[13px] uppercase tracking-[0.14em] text-ink-muted hover:text-bronze">
        ← Section content
      </Link>
      <h1 className="mt-3 font-display text-[40px] leading-tight text-ink">
        {sectionTypeLabels[sectionType]}
      </h1>
      <div className="mt-8 max-w-[860px]">
        <SectionContentEditor
          type={sectionType}
          schema={jsonSchema}
          initialValue={value}
          media={media.map((m) => ({ id: m.id, filename: m.filename, alt: m.alt }))}
        />
      </div>
    </div>
  );
}
