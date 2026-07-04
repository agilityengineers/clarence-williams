import { getNavPages, getSectionContentMap } from "./pages";
import { getSiteSettings, type SiteSettings } from "./settings";
import { sectionSchemas } from "./sections/schemas";
import type { z } from "zod/v4";

export type FooterContent = z.infer<typeof sectionSchemas.footer>;

export type PublicLayout = {
  navPages: Awaited<ReturnType<typeof getNavPages>>;
  settings: SiteSettings;
  footer: FooterContent | null;
};

/**
 * Everything the shell (nav + footer) needs — shared by the /public/layout
 * API route and the server-side prerender path so both stay in sync.
 */
export async function getPublicLayout(): Promise<PublicLayout> {
  const [navPages, settings, sectionContent] = await Promise.all([
    getNavPages(),
    getSiteSettings(),
    getSectionContentMap(),
  ]);
  const footerRaw = sectionContent["footer"];
  const footerParsed = footerRaw ? sectionSchemas.footer.safeParse(footerRaw) : null;
  return {
    navPages,
    settings,
    footer: footerParsed?.success ? footerParsed.data : null,
  };
}
