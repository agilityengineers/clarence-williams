import { Router, type IRouter } from "express";
import { rateLimit } from "express-rate-limit";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "../lib/cw/db";
import { ensureBootstrapped } from "../lib/cw/bootstrap";
import { getPublishedPage, getSectionContentMap, getSitemapPages } from "../lib/cw/pages";
import { getBaseUrl } from "../lib/cw/base-url";
import { getSiteSettings } from "../lib/cw/settings";
import { getPublicLayout } from "../lib/cw/layout";
import { getAssessmentBySlug, scoreAssessment } from "../lib/cw/assessments";
import { getFeedItems } from "../lib/cw/rss";
import { notifyLead } from "../lib/cw/notifications";

const router: IRouter = Router();

/**
 * Shared limiter for both public lead forms: 10 submissions / 15 min / IP.
 * Uses the in-memory store, which is per-instance on autoscale — the
 * effective limit multiplies by live instance count and resets when an
 * instance is recycled. Acceptable for spam deterrence; a shared store
 * (e.g. rate-limit-postgresql) can be swapped in here without touching
 * the routes. Relies on `trust proxy = 1` set in app.ts for correct IPs.
 */
const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Too many submissions from your network. Please try again in a few minutes.",
  },
});

/**
 * Honeypot: the forms render an off-screen "website" input that humans
 * never see or fill. A non-empty value marks the submission as a bot.
 */
function isHoneypotTripped(body: unknown): boolean {
  return String((body as { website?: unknown } | null)?.website ?? "").trim() !== "";
}

/** Everything the shell (nav + footer) needs in one call. */
router.get("/public/layout", async (_req, res): Promise<void> => {
  await ensureBootstrapped();
  const { navPages, settings, footer } = await getPublicLayout();
  res.json({
    navPages,
    settings: {
      calendlyUrl: settings.calendlyUrl,
      contact: settings.contact,
      metaDefaults: settings.metaDefaults,
      insightsDefaults: settings.insightsDefaults,
    },
    footer,
  });
});

router.get("/public/pages/:slug", async (req, res): Promise<void> => {
  const slug = String(req.params.slug);
  const page = await getPublishedPage(slug);
  if (!page) {
    res.status(404).json({ error: "Page not found." });
    return;
  }
  res.json({ page });
});

router.get("/public/assessments/:slug", async (req, res): Promise<void> => {
  const assessment = await getAssessmentBySlug(String(req.params.slug));
  if (!assessment || !assessment.active) {
    res.status(404).json({ error: "Assessment not found." });
    return;
  }
  res.json({ assessment });
});

router.post("/public/resume-request", leadLimiter, async (req, res): Promise<void> => {
  const values = {
    name: String(req.body?.name ?? "").trim(),
    email: String(req.body?.email ?? "").trim(),
    company: String(req.body?.company ?? "").trim(),
    roleDetails: String(req.body?.roleDetails ?? "").trim(),
  };

  if (!values.name || !values.email || !values.roleDetails) {
    res.status(400).json({ error: "Please provide your name, email, and a note about the role.", values });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    res.status(400).json({ error: "Please enter a valid email address.", values });
    return;
  }
  if (
    values.name.length > 200 ||
    values.email.length > 320 ||
    values.company.length > 300 ||
    values.roleDetails.length > 5000
  ) {
    res.status(400).json({ error: "One of the fields is too long.", values });
    return;
  }

  // Bots that fill the honeypot get the real success shape but nothing
  // is stored or emailed.
  if (isHoneypotTripped(req.body)) {
    res.json({ ok: true, firstName: values.name.split(" ")[0] });
    return;
  }

  await ensureBootstrapped();
  const db = await getDb();
  await db.insert(schema.resumeRequests).values(values);

  await notifyLead("resume", {
    name: values.name,
    email: values.email,
    company: values.company || "—",
    roleDetails: values.roleDetails,
  });

  res.json({ ok: true, firstName: values.name.split(" ")[0] });
});

router.post("/public/assessments/submit", leadLimiter, async (req, res): Promise<void> => {
  const input = req.body ?? {};
  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim();
  const phone = String(input.phone ?? "").trim();
  const assessmentId = String(input.assessmentId ?? "");
  const answerOptionIds: unknown = input.answerOptionIds;

  if (!name || !email || !phone) {
    res.status(400).json({ ok: false, error: "Please provide your name, email, and phone number." });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ ok: false, error: "Please enter a valid email address." });
    return;
  }
  if (!/^[\d\s()+.\-]{7,25}$/.test(phone)) {
    res.status(400).json({ ok: false, error: "Please enter a valid phone number." });
    return;
  }
  if (name.length > 200 || !Array.isArray(answerOptionIds) || answerOptionIds.length > 50) {
    res.status(400).json({ ok: false, error: "Invalid submission." });
    return;
  }

  await ensureBootstrapped();
  const db = await getDb();
  const scored = await scoreAssessment(assessmentId, answerOptionIds.map(String));
  if (!scored) {
    res.status(400).json({ ok: false, error: "Please answer every question, then try again." });
    return;
  }

  // Honeypot check runs after scoring so bots receive a genuine-looking
  // success payload, but no lead is stored and no notification is sent.
  if (isHoneypotTripped(req.body)) {
    res.json({ ok: true, score: scored.score, tier: scored.tier });
    return;
  }

  const assessment = await db.query.assessments.findFirst({
    where: (a, { eq: eqOp }) => eqOp(a.id, assessmentId),
  });

  await db.insert(schema.assessmentSubmissions).values({
    assessmentId,
    name,
    email,
    phone,
    answers: answerOptionIds.map(String),
    score: scored.score,
    tierLabel: scored.tier.label,
  });

  await notifyLead("assessment", {
    assessment: assessment?.title ?? "Assessment",
    name,
    email,
    phone,
    score: String(scored.score),
    tier: scored.tier.label,
  });

  res.json({ ok: true, score: scored.score, tier: scored.tier });
});

/**
 * Sitemap for search engines. The proxy only routes /api/* to this server,
 * so the sitemap lives at /api/sitemap.xml rather than the site root. That
 * is a valid location: the sitemaps.org path-scoping rule is waived for
 * sitemaps declared via a same-host robots.txt `Sitemap:` directive, which
 * the built robots.txt provides. Do not "fix" this by moving it.
 */
router.get("/sitemap.xml", async (_req, res): Promise<void> => {
  await ensureBootstrapped();
  const base = getBaseUrl();
  const pages = await getSitemapPages();
  const db = await getDb();
  const activeAssessments = await db
    .select({ slug: schema.assessments.slug, updatedAt: schema.assessments.updatedAt })
    .from(schema.assessments)
    .where(eq(schema.assessments.active, true));

  const urls = [
    // "home" is served at "/" (a literal /home 404s in the SPA).
    ...pages.map((p) => ({
      loc: p.slug === "home" ? `${base}/` : `${base}/${p.slug}`,
      lastmod: p.updatedAt,
    })),
    ...activeAssessments.map((a) => ({
      loc: `${base}/assessment/${a.slug}`,
      lastmod: a.updatedAt,
    })),
  ];
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url><loc>${esc(u.loc)}</loc><lastmod>${u.lastmod.toISOString().slice(0, 10)}</lastmod></url>`,
      )
      .join("\n") +
    `\n</urlset>\n`;
  res
    .set({
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    })
    .send(xml);
});

/** Books for the author sections (featured hero + archive grid). */
router.get("/public/books", async (_req, res): Promise<void> => {
  await ensureBootstrapped();
  const db = await getDb();
  const books = await db
    .select()
    .from(schema.books)
    .orderBy(desc(schema.books.createdAt));
  res.json({ books });
});

/**
 * RSS feed items for the Insights section. Only feed URLs that are actually
 * configured (site settings, shared section content, or a page override)
 * are allowed, so this is not an open proxy.
 */
router.get("/public/insights", async (req, res): Promise<void> => {
  const feedUrl = String(req.query.feedUrl ?? "");
  if (!feedUrl) {
    res.status(400).json({ error: "feedUrl is required." });
    return;
  }
  await ensureBootstrapped();
  const db = await getDb();
  const allowed = new Set<string>();
  const settings = await getSiteSettings();
  allowed.add(settings.insightsDefaults.feedUrl);
  const shared = await getSectionContentMap();
  const insightsShared = shared["insights"] as { feedUrl?: string } | undefined;
  if (insightsShared?.feedUrl) allowed.add(insightsShared.feedUrl);
  const overrides = await db
    .select({ overrides: schema.pageSections.overrides })
    .from(schema.pageSections)
    .where(eq(schema.pageSections.sectionType, "insights"));
  for (const row of overrides) {
    const o = row.overrides as { feedUrl?: string } | null;
    if (o?.feedUrl) allowed.add(o.feedUrl);
  }
  if (!allowed.has(feedUrl)) {
    res.status(400).json({ error: "Unknown feed URL." });
    return;
  }
  const items = await getFeedItems(feedUrl);
  res.json({ items });
});

export default router;
