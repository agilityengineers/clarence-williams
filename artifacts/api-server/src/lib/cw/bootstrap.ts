import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb, schema } from "./db";
import { defaultSectionContent } from "./sections/defaults";
import { DEFAULT_SITE_SETTINGS } from "./settings";
import { logger } from "../logger";

/**
 * Runs once per server boot: seeds initial content if the database is empty.
 * Safe to run repeatedly — seeding is guarded by a kv flag. The table
 * structure itself is managed by drizzle-kit push (see @workspace/db).
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
  await seedIfEmpty(db);
  await seedLegalPagesIfMissing(db);
  await seedAdminFromSecrets(db);
}

/**
 * Ensures the single admin account matches the ADMIN_EMAIL / ADMIN_PASSWORD
 * secrets. Runs every boot, so changing ADMIN_PASSWORD and redeploying resets
 * the login password — this is the account-recovery path. When the secrets are
 * absent, any existing admin row is left untouched (nothing is deleted).
 * Any admin whose email does not match ADMIN_EMAIL is removed to preserve the
 * single-admin model.
 */
async function seedAdminFromSecrets(db: Awaited<ReturnType<typeof getDb>>) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const rows = await db.select().from(schema.adminUsers);
  for (const row of rows) {
    if (row.email !== email) {
      await db.delete(schema.adminUsers).where(eq(schema.adminUsers.id, row.id));
    }
  }

  const existing = rows.find((r) => r.email === email);
  if (existing) {
    // Only re-hash when the password actually changed, so existing sessions
    // (and the stored hash) stay stable across restarts.
    if (await bcrypt.compare(password, existing.passwordHash)) return;
    const passwordHash = await bcrypt.hash(password, 12);
    await db
      .update(schema.adminUsers)
      .set({ passwordHash })
      .where(eq(schema.adminUsers.id, existing.id));
    logger.info("Admin password synced from ADMIN_PASSWORD secret");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(schema.adminUsers).values({ email, passwordHash });
  logger.info({ email }, "Admin account created from ADMIN_EMAIL / ADMIN_PASSWORD secrets");
}

async function seedIfEmpty(db: Awaited<ReturnType<typeof getDb>>) {
  const flag = await db.select().from(schema.kv).where(eq(schema.kv.key, "seeded.v1"));
  if (flag.length > 0) return;

  logger.info("Seeding initial site content");

  await db
    .insert(schema.settings)
    .values({ key: "site", value: DEFAULT_SITE_SETTINGS })
    .onConflictDoNothing();

  for (const [type, content] of Object.entries(defaultSectionContent)) {
    await db.insert(schema.sectionContent).values({ type, content }).onConflictDoNothing();
  }

  // Section stacks mirror the designed page assemblies (Page Home/Services/
  // About .dc.html). Insights ships on Home but toggled off until Clarence
  // enables it — the admin toggle controls visibility per page.
  const corePages: Array<{
    slug: string;
    title: string;
    metaTitle: string;
    metaDescription: string;
    showInNav: boolean;
    navLabel?: string;
    navOrder: number;
    includeInSitemap: boolean;
    footerStyle: "full" | "slim";
    sections: Array<{ type: string; enabled?: boolean }>;
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
      footerStyle: "full",
      sections: [
        { type: "hero" },
        { type: "story" },
        { type: "ventures" },
        { type: "insights", enabled: false },
        { type: "bookCall" },
      ],
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
      footerStyle: "full",
      sections: [{ type: "services" }, { type: "story" }, { type: "bookCall" }],
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
      footerStyle: "full",
      sections: [{ type: "about" }, { type: "proof" }, { type: "bookCall" }],
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
      footerStyle: "full",
      sections: [{ type: "authorFeatured" }, { type: "authorArchive" }, { type: "bookCall" }],
    },
    {
      slug: "resume",
      title: "Resume",
      metaTitle: "Request Resume — Clarence Williams",
      metaDescription: "Request the current resume of Clarence Williams, tailored to your role.",
      showInNav: false,
      navOrder: 101,
      includeInSitemap: false, // link-only page, per Clarence: only page kept out of the sitemap
      footerStyle: "slim",
      sections: [{ type: "resumeRequest" }],
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
        footerStyle: p.footerStyle,
        createdBy: "admin",
      })
      .onConflictDoNothing()
      .returning();
    if (!page) continue;
    for (let i = 0; i < p.sections.length; i++) {
      await db.insert(schema.pageSections).values({
        pageId: page.id,
        position: i,
        sectionType: p.sections[i].type,
        enabled: p.sections[i].enabled ?? true,
      });
    }
  }

  // Featured book (cover image supplied by Clarence later via the dashboard).
  await db.insert(schema.books).values({
    title: "Marketing Mayhem",
    blurb:
      "Marketing has never been noisier. Mayhem is what happens when businesses chase every channel without a story that positions the customer as the hero. This book is the field guide for cutting through it.",
    primaryUrl: "https://marketing-mayhem.com/",
    amazonUrl: "https://www.amazon.com/",
    featured: true,
    position: 0,
  });

  await seedAssessments(db);

  await db.insert(schema.kv).values({ key: "seeded.v1", value: new Date().toISOString() });
}

/**
 * Adds the privacy and terms pages to databases seeded before those pages
 * existed. Runs behind its own kv flag (NOT seeded.v1, which is already set
 * in production) so it executes exactly once per database — a slug-existence
 * check instead would resurrect the pages on every boot if they were ever
 * deleted in the admin. Content is a draft for Clarence's review, editable
 * from the dashboard like any other page.
 */
async function seedLegalPagesIfMissing(db: Awaited<ReturnType<typeof getDb>>) {
  const flag = await db.select().from(schema.kv).where(eq(schema.kv.key, "seeded.legalPages.v1"));
  if (flag.length > 0) return;

  logger.info("Seeding legal pages (privacy, terms)");

  const legalPages: Array<{
    slug: string;
    title: string;
    metaTitle: string;
    metaDescription: string;
    headline: string;
    paragraphs: string[];
  }> = [
    {
      slug: "privacy",
      title: "Privacy Policy",
      metaTitle: "Privacy Policy — Clarence Williams",
      metaDescription:
        "How Clarence Williams collects, uses, and protects the information you share through this site.",
      headline: "Privacy Policy",
      paragraphs: [
        "Last updated: July 2026. This website is operated by Clarence Williams. This policy explains what information the site collects, how it is used, and the choices you have.",
        "Information you provide. When you complete an assessment or request a resume, you provide your name, email address, phone number, company or organization, and details about your role or opportunity. The site does not offer user accounts and does not collect payment information.",
        "How your information is used. The information you submit is used to respond to your inquiry, deliver your assessment results, send the resume you requested, and follow up about services you may be interested in. It is not used for automated marketing lists.",
        "Storage and retention. Submissions are stored in a secured database and retained only as long as needed for the purposes above. You may request deletion at any time.",
        "Sharing. Your information is never sold. It is shared only with the infrastructure providers that host this site and deliver its email, and only as needed to operate the site.",
        "Cookies. The public site does not use advertising or tracking cookies. A single functional cookie is used to keep the site administrator signed in to the administration area.",
        "Your choices. You may email at any time to review, correct, or delete the information you have submitted.",
        "Contact. Questions about this policy or your information: emailme@clarencewilliams.com.",
      ],
    },
    {
      slug: "terms",
      title: "Terms of Service",
      metaTitle: "Terms of Service — Clarence Williams",
      metaDescription: "Terms governing your use of clarencewilliams.com.",
      headline: "Terms of Service",
      paragraphs: [
        "Last updated: July 2026. By using this website you agree to these terms. If you do not agree, please do not use the site.",
        "Informational content. The content on this site, including assessment results and scores, is provided for general informational purposes only. It does not constitute professional, financial, or legal advice, and using the site does not create a consulting or advisory relationship.",
        "Intellectual property. All content on this site — text, assessments, branding, and design — belongs to Clarence Williams and may not be reproduced without permission.",
        "Acceptable use. You agree not to misuse the site, including submitting false information through its forms or attempting to interfere with its operation.",
        "Limitation of liability. The site is provided as-is, without warranties of any kind. To the fullest extent permitted by law, Clarence Williams is not liable for any damages arising from your use of the site or reliance on its content.",
        "Contact. Questions about these terms: emailme@clarencewilliams.com.",
      ],
    },
  ];

  for (const p of legalPages) {
    const [page] = await db
      .insert(schema.pages)
      .values({
        slug: p.slug,
        title: p.title,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        status: "published",
        showInNav: false,
        navOrder: 200,
        includeInSitemap: true,
        footerStyle: "slim",
        createdBy: "admin",
      })
      .onConflictDoNothing()
      .returning();
    if (!page) continue;
    // Full prose content lives in overrides so these pages are independent
    // of the shared per-type section content.
    await db.insert(schema.pageSections).values({
      pageId: page.id,
      position: 0,
      sectionType: "prose",
      overrides: {
        background: "ivory",
        eyebrow: "LEGAL",
        headline: p.headline,
        paragraphs: p.paragraphs,
      },
    });
  }

  await db
    .insert(schema.kv)
    .values({ key: "seeded.legalPages.v1", value: new Date().toISOString() })
    .onConflictDoNothing();
}

/**
 * Both client-qualification instruments, seeded verbatim from the design
 * prototypes (questions, option weights 0–3, and tier copy). Everything
 * here is editable post-launch from the admin dashboard.
 */
async function seedAssessments(db: Awaited<ReturnType<typeof getDb>>) {
  type Q = { t: string; o: string[]; v: number[] };
  const instruments: Array<{
    slug: string;
    title: string;
    intro: object;
    questions: Q[];
    tiers: Array<{ minScore: number; maxScore: number; label: string; headline: string; recommendation: string }>;
  }> = [
    {
      slug: "agility",
      title: "Agility Assessment",
      intro: {
        eyebrow: "AGILITY ASSESSMENT",
        headline: "How agile is your delivery organization?",
        description:
          "Ten questions about how your organization plans, builds, and ships. Your score identifies where you stand today — and whether a guided agile transformation is the right next step.",
        metaLines: ["10 QUESTIONS", "~3 MINUTES", "SCORED RESULTS"],
        crossLinkText: "LOOKING FOR THE BUSINESS HEALTH ASSESSMENT? →",
      },
      questions: [
        { t: "What is your company’s annual revenue?", o: ["Under $5M", "$5M–$50M", "$50M–$250M", "Over $250M"], v: [1, 3, 3, 2] },
        { t: "How are technology initiatives delivered today?", o: ["Strict waterfall, big up-front plans", "Mostly waterfall with some agile teams", "Agile teams, inconsistent practices", "Scaled agile across the organization"], v: [0, 1, 2, 3] },
        { t: "How often does your organization release to production?", o: ["A few times a year", "Monthly", "Every sprint (1–2 weeks)", "On demand / continuously"], v: [0, 1, 2, 3] },
        { t: "How predictable are delivery dates and budgets?", o: ["Routinely missed", "Hit about half the time", "Usually hit, with heroics", "Consistently predictable"], v: [0, 1, 2, 3] },
        { t: "Does executive leadership sponsor process change?", o: ["No appetite for change", "Interested but not committed", "Committed sponsor identified", "Active executive mandate"], v: [0, 1, 2, 3] },
        { t: "Who owns product priorities day to day?", o: ["Nobody clearly", "A committee", "Named product owners, part-time", "Dedicated, empowered product owners"], v: [0, 1, 2, 3] },
        { t: "Do you measure delivery (cycle time, MTTR, quality escapes)?", o: ["No delivery metrics", "Ad-hoc reporting", "Some metrics, reviewed sometimes", "Metrics reviewed on a cadence"], v: [0, 1, 2, 3] },
        { t: "How much rework or defect escape do you experience?", o: ["Constant firefighting", "Frequent", "Occasional", "Rare and shrinking"], v: [0, 1, 2, 3] },
        { t: "How is work visualized across teams?", o: ["It isn’t", "Spreadsheets and status meetings", "Team-level boards", "Portfolio-level visibility"], v: [0, 1, 2, 3] },
        { t: "When would you want to begin improving delivery?", o: ["Just researching", "Within a year", "Within a quarter", "Immediately"], v: [0, 1, 2, 3] },
      ],
      tiers: [
        {
          minScore: 75,
          maxScore: 100,
          label: "Prime candidate",
          headline: "A prime candidate for transformation.",
          recommendation:
            "Your organization has the foundation and the mandate to move quickly. A focused engagement with Clarence can convert that readiness into measurable delivery gains.",
        },
        {
          minScore: 50,
          maxScore: 74,
          label: "Strong potential",
          headline: "Strong potential, with clear constraints.",
          recommendation:
            "You have real strengths to build on, and a small number of constraints doing most of the damage. A guided roadmap would target those first.",
        },
        {
          minScore: 0,
          maxScore: 49,
          label: "Foundational stage",
          headline: "At the foundational stage.",
          recommendation:
            "The fundamentals need attention before scaling change. A confidential conversation can help you sequence the first, highest-leverage moves.",
        },
      ],
    },
    {
      slug: "business-health",
      title: "Business Health Assessment",
      intro: {
        eyebrow: "BUSINESS HEALTH ASSESSMENT",
        headline: "How healthy is your business, really?",
        description:
          "Ten questions across revenue, leadership, operations, and market position. Your score highlights the strengths to build on and the constraints holding growth back.",
        metaLines: ["10 QUESTIONS", "~3 MINUTES", "SCORED RESULTS"],
        crossLinkText: "LOOKING FOR THE AGILITY ASSESSMENT? →",
      },
      questions: [
        { t: "What is your company’s annual revenue?", o: ["Under $5M", "$5M–$50M", "$50M–$250M", "Over $250M"], v: [1, 3, 3, 2] },
        { t: "How has revenue trended over the last three years?", o: ["Declining", "Flat", "Growing under 10%/yr", "Growing over 10%/yr"], v: [0, 1, 2, 3] },
        { t: "How would you describe profitability?", o: ["Losing money", "Break-even", "Profitable, below industry norms", "Consistently strong margins"], v: [0, 1, 2, 3] },
        { t: "How dependent is the business on you, the owner?", o: ["Everything runs through me", "Most decisions need me", "Leadership team handles operations", "Business runs without me"], v: [0, 1, 2, 3] },
        { t: "How predictable is your sales pipeline?", o: ["Feast or famine", "Referrals only", "Some repeatable channels", "Predictable, measured funnel"], v: [0, 1, 2, 3] },
        { t: "What share of revenue comes from your largest customer?", o: ["Over 50%", "25–50%", "10–25%", "Under 10%"], v: [0, 1, 2, 3] },
        { t: "Are core processes documented and followed?", o: ["In people’s heads", "Partially documented", "Documented, loosely followed", "Documented and audited"], v: [0, 1, 2, 3] },
        { t: "How is your leadership bench?", o: ["No second layer", "One key lieutenant", "Functional leaders in place", "Deep, accountable leadership team"], v: [0, 1, 2, 3] },
        { t: "Do you operate against a written strategic plan?", o: ["No plan", "Annual budget only", "Plan exists, rarely revisited", "Plan reviewed on a cadence"], v: [0, 1, 2, 3] },
        { t: "Do you have trusted peers to pressure-test decisions?", o: ["I decide alone", "Informal advisors", "A mentor or coach", "A structured peer advisory group"], v: [0, 1, 2, 3] },
      ],
      tiers: [
        {
          minScore: 75,
          maxScore: 100,
          label: "Ready to scale",
          headline: "A healthy business, ready to scale.",
          recommendation:
            "Your fundamentals are strong — predictable revenue, real leadership depth, and a business that runs without heroics. The next gains come from strategy and disciplined peer counsel.",
        },
        {
          minScore: 50,
          maxScore: 74,
          label: "Solid footing",
          headline: "Solid footing, with clear constraints.",
          recommendation:
            "The business is working, but a few constraints — owner dependence, pipeline predictability, or leadership bench — are capping growth. A guided plan would target those first.",
        },
        {
          minScore: 0,
          maxScore: 49,
          label: "Foundational stage",
          headline: "At the foundational stage.",
          recommendation:
            "The fundamentals need attention before scaling. A confidential conversation can help you sequence the first, highest-leverage moves toward a durable business.",
        },
      ],
    },
  ];

  for (const inst of instruments) {
    const [assessment] = await db
      .insert(schema.assessments)
      .values({
        slug: inst.slug,
        title: inst.title,
        active: true,
        intro: inst.intro,
        resultsCopy: {
          headline: "YOUR RESULTS",
          leadCapture: {
            title: "See your results",
            description:
              "Enter your details and your score appears immediately. Clarence reviews every submission personally and follows up where he can add value.",
          },
        },
      })
      .onConflictDoNothing()
      .returning();
    if (!assessment) continue;
    for (let qi = 0; qi < inst.questions.length; qi++) {
      const q = inst.questions[qi];
      const [qRow] = await db
        .insert(schema.assessmentQuestions)
        .values({ assessmentId: assessment.id, position: qi, text: q.t })
        .returning({ id: schema.assessmentQuestions.id });
      for (let oi = 0; oi < q.o.length; oi++) {
        await db.insert(schema.assessmentOptions).values({
          questionId: qRow.id,
          position: oi,
          label: q.o[oi],
          weight: q.v[oi],
        });
      }
    }
    for (const tier of inst.tiers) {
      await db.insert(schema.assessmentTiers).values({ assessmentId: assessment.id, ...tier });
    }
  }
}
