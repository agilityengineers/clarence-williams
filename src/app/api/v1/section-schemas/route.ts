import { authenticateApiRequest, apiError } from "@/lib/api-auth";
import { getSectionJsonSchemas } from "@/lib/sections/jsonschema";
import { stackableSectionTypes } from "@/lib/sections/schemas";

/**
 * Machine-readable catalog of section types and their content JSON Schemas.
 * AI tools read this before composing pages via POST /api/v1/pages.
 */
export async function GET(req: Request) {
  if (!(await authenticateApiRequest(req))) return apiError(401, "Invalid or missing API key.");
  const all = getSectionJsonSchemas();
  const sections = Object.fromEntries(
    (stackableSectionTypes as string[]).map((t) => [t, all[t]]),
  );
  return Response.json({
    sections,
    usage: {
      createPage: "POST /api/v1/pages",
      pageShape:
        "{ slug, title, metaTitle?, metaDescription?, status?, showInNav?=false, includeInSitemap?=true, jsonLd?, sections: [{ type, enabled?, content? }] }",
      note: "Omit a section's content to render the site-wide shared content for that section type. Provide content matching the section's schema to override it for this page.",
    },
  });
}
