import type { z } from "zod/v4";
import type { SectionType, footerSchema } from "@/lib/sections/schemas";

/** Mirrors the server's ResolvedSection (api-server lib/cw/pages.ts). */
export type ResolvedSection = {
  id: string;
  type: SectionType;
  enabled: boolean;
  content: unknown;
};

/** Mirrors the server's ResolvedPage. */
export type ResolvedPage = {
  id: string;
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  status: "draft" | "published";
  includeInSitemap: boolean;
  footerStyle: "full" | "slim";
  jsonLd: unknown;
  sections: ResolvedSection[];
};

export type SiteSettings = {
  calendlyUrl: string;
  contact: { email: string; phone: string; address: string };
  insightsDefaults: {
    feedUrl: string;
    articleCount: number;
    layout: "Editorial List" | "Card Grid" | "Feature + List";
  };
  metaDefaults: { siteName: string; titleSuffix: string };
};

export type NavPage = {
  slug: string;
  title: string;
  navLabel: string | null;
};

export type FooterContent = z.infer<typeof footerSchema>;

/** GET /api/public/layout response. */
export type LayoutData = {
  navPages: NavPage[];
  settings: SiteSettings;
  footer: FooterContent | null;
};
