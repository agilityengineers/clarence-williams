import { z } from "zod";
import { sectionSchemas, sectionTypeLabels, type SectionType } from "./schemas";

/**
 * JSON Schema form of every section content schema. Drives both the
 * admin's schema-generated editor forms and GET /api/v1/section-schemas
 * (the catalog AI tools read before composing pages).
 */
export function getSectionJsonSchemas(): Record<
  string,
  { label: string; schema: Record<string, unknown> }
> {
  const out: Record<string, { label: string; schema: Record<string, unknown> }> = {};
  for (const [type, schema] of Object.entries(sectionSchemas)) {
    out[type] = {
      label: sectionTypeLabels[type as SectionType],
      schema: z.toJSONSchema(schema) as Record<string, unknown>,
    };
  }
  return out;
}
