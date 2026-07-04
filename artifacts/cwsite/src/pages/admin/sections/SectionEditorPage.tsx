import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { apiGet } from "@/lib/api";
import { getSectionJsonSchemas } from "@/lib/sections/jsonschema";
import { defaultSectionContent } from "@/lib/sections/defaults";
import { sectionSchemas, sectionTypeLabels, type SectionType } from "@/lib/sections/schemas";
import { useAdminQuery } from "../session";
import SectionContentEditor from "./SectionContentEditor";

type MediaItem = { id: string; filename: string; alt: string };

export default function SectionEditorPage({ type }: { type: string }) {
  const [, navigate] = useLocation();

  useEffect(() => {
    document.title = "Section Content — Admin";
  }, []);

  useEffect(() => {
    if (!(type in sectionSchemas)) navigate("/sections");
  }, [type, navigate]);

  const sectionType = type as SectionType;
  const isValid = type in sectionSchemas;

  const contentQuery = useAdminQuery<{ content: unknown; enabled: boolean }>(
    ["admin", "section", type],
    () => apiGet<{ content: unknown; enabled: boolean }>(`/admin/sections/${type}`),
    isValid,
  );
  const mediaQuery = useAdminQuery<{ items: MediaItem[] }>(
    ["admin", "media"],
    () => apiGet<{ items: MediaItem[] }>("/admin/media"),
    isValid,
  );

  if (!isValid) return null;

  const jsonSchema = getSectionJsonSchemas()[sectionType].schema;

  return (
    <div>
      <Link href="/sections" className="font-sans text-[13px] uppercase tracking-[0.14em] text-ink-muted hover:text-bronze">
        ← Section content
      </Link>
      <h1 className="mt-3 font-display text-[40px] leading-tight text-ink">
        {sectionTypeLabels[sectionType]}
      </h1>
      <div className="mt-8 max-w-[860px]">
        {contentQuery.data && mediaQuery.data ? (
          <SectionContentEditor
            type={sectionType}
            schema={jsonSchema}
            initialValue={resolveValue(sectionType, contentQuery.data.content)}
            initialEnabled={contentQuery.data.enabled}
            media={mediaQuery.data.items.map((m) => ({ id: m.id, filename: m.filename, alt: m.alt }))}
          />
        ) : (
          <p className="font-sans text-[15px] text-ink-muted">Loading…</p>
        )}
      </div>
    </div>
  );
}

function resolveValue(type: SectionType, content: unknown): unknown {
  const parsed = sectionSchemas[type].safeParse(content);
  return parsed.success ? parsed.data : defaultSectionContent[type];
}
