import { eq } from "drizzle-orm";
import { getDb, schema } from "./index";
import { defaultSectionContent } from "@/lib/sections/defaults";
import { DEFAULT_SITE_SETTINGS } from "@/lib/settings";

/**
 * Runs once per server boot (from instrumentation.ts): applies pending SQL
 * migrations, then seeds initial content if the database is empty. Safe to
 * run repeatedly — migrations are tracked, and seeding is guarded by a kv
 * flag. This keeps Replit deploys zero-command: import → add Postgres → run.
 */

let bootstrapped: Promise<void> | null = null;

export function ensureBootstrapped(): Promise<void> {
  if (!bootstrapped) {
    bootstrapped = bootstrap().catch((err) => {
      bootstrapped = null;
      throw err;
    });
  }
  return bootstrapped;
}

async function bootstrap() {
  const db = await getDb();

  if (process.env.DATABASE_URL) {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    await migrate(db, { migrationsFolder: "./drizzle" });
  } else {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(db as never, { migrationsFolder: "./drizzle" });
  }

  await seedIfEmpty(db);
}

async function seedIfEmpty(db: Awaited<ReturnType<typeof getDb>>) {
  const flag = await db.select().from(schema.kv).where(eq(schema.kv.key, "seeded.v1"));
  if (flag.length > 0) return;

  await db
    .insert(schema.settings)
    .values({ key: "site", value: DEFAULT_SITE_SETTINGS })
    .onConflictDoNothing();

  for (const [type, content] of Object.entries(defaultSectionContent)) {
    await db.insert(schema.sectionContent).values({ type, content }).onConflictDoNothing();
  }

  const corePages: Array<{
    slug: string;
    title: string;
    metaTitle: string;
    metaDescription: string;
    showInNav: boolean;
    navLabel?: string;
    navOrder: number;
    includeInSitemap: boolean;
    sections: string[];
  }> = [
    {
      slug: "home",
      title: "Home",
      metaTitle: "Clarence Williams — Business & Management Consultant",
      metaDescription:
        "Business consulting, software delivery leadership, and brand & marketing guidance from Clarence Williams — Vistage Chair, Alpharetta, GA.",
      showInNav: true,
      navLabel: "Home",
      navOrder: 0,
      includeInSitemap: true,
      sections: ["hero", "services", "story", "proof", "ventures", "insights", "bookCall"],
    },
    {
      slug: "services",
      title: "Services",
      metaTitle: "Services — Clarence Williams",
      metaDescription:
        "Three pillars: Business Consulting, Software Delivery Leadership, and Brand & Marketing.",
      showInNav: true,
      navLabel: "Services",
      navOrder: 1,
      includeInSitemap: true,
      sections: ["services", "story", "proof", "bookCall"],
    },
    {
      slug: "about",
      title: "About",
      metaTitle: "About — Clarence Williams",
      metaDescription:
        "About Clarence Williams: business & management consultant and Vistage Chair in Alpharetta, GA.",
      showInNav: true,
      navLabel: "About",
      navOrder: 2,
      includeInSitemap: true,
      sections: ["about", "ventures", "bookCall"],
    },
    {
      slug: "author",
      title: "Author",
      metaTitle: "Marketing Mayhem — Clarence Williams, Author",
      metaDescription:
        "Marketing Mayhem, the latest book by Clarence Williams, plus his earlier titles.",
      showInNav: false,
      navOrder: 100,
      includeInSitemap: true,
      sections: ["authorFeatured", "authorArchive", "bookCall"],
    },
    {
      slug: "resume",
      title: "Resume",
      metaTitle: "Request Resume — Clarence Williams",
      metaDescription: "Request the current resume of Clarence Williams, tailored to your role.",
      showInNav: false,
      navOrder: 101,
      includeInSitemap: false, // link-only page, per Clarence: only page kept out of the sitemap
      sections: ["resumeRequest"],
    },
  ];

  for (const p of corePages) {
    const [page] = await db
      .insert(schema.pages)
      .values({
        slug: p.slug,
        title: p.title,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        status: "published",
        showInNav: p.showInNav,
        navLabel: p.navLabel,
        navOrder: p.navOrder,
        includeInSitemap: p.includeInSitemap,
        createdBy: "admin",
      })
      .onConflictDoNothing()
      .returning();
    if (!page) continue;
    for (let i = 0; i < p.sections.length; i++) {
      await db.insert(schema.pageSections).values({
        pageId: page.id,
        position: i,
        sectionType: p.sections[i],
        enabled: true,
      });
    }
  }

  await db.insert(schema.kv).values({ key: "seeded.v1", value: new Date().toISOString() });
}
