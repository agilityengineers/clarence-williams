import "server-only";
import { XMLParser } from "fast-xml-parser";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export type FeedItem = {
  title: string;
  link: string;
  date: string;
  thumb: string;
  excerpt: string;
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Server-side RSS fetch with a database cache (no client CORS issues, and
 * article lists survive feed outages). Supports rss.app-format and direct
 * RSS 2.0 feeds; falls back to the last cached copy, then to baked sample
 * articles so the section never renders empty.
 */
export async function getFeedItems(feedUrl: string): Promise<FeedItem[]> {
  const db = await getDb();
  const cached = await db.select().from(schema.rssCache).where(eq(schema.rssCache.feedUrl, feedUrl));
  const row = cached[0];
  if (row && Date.now() - row.fetchedAt.getTime() < CACHE_TTL_MS) {
    return row.items as FeedItem[];
  }

  try {
    const res = await fetch(feedUrl, {
      headers: { "user-agent": "ClarenceWilliamsSite/1.0 (+https://clarencewilliams.com)" },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`feed responded ${res.status}`);
    const items = parseRss(await res.text());
    if (items.length === 0) throw new Error("feed parsed to zero items");
    await db
      .insert(schema.rssCache)
      .values({ feedUrl, items, fetchedAt: new Date() })
      .onConflictDoUpdate({
        target: schema.rssCache.feedUrl,
        set: { items, fetchedAt: new Date() },
      });
    return items;
  } catch (err) {
    console.error(`[rss] fetch failed for ${feedUrl}:`, err);
    if (row) return row.items as FeedItem[]; // stale beats empty
    return FALLBACK_ITEMS;
  }
}

export function parseRss(xml: string): FeedItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: false,
  });
  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel ?? doc?.feed;
  if (!channel) return [];
  let items = channel.item ?? channel.entry ?? [];
  if (!Array.isArray(items)) items = [items];

  return items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any): FeedItem => {
      const text = (v: unknown): string => {
        if (typeof v === "string") return v;
        if (v && typeof v === "object" && "#text" in v) return String((v as Record<string, unknown>)["#text"]);
        return "";
      };
      const media = item["media:thumbnail"] ?? item["media:content"];
      const enclosure = item.enclosure;
      const thumb =
        (media && (media["@_url"] ?? (Array.isArray(media) ? media[0]?.["@_url"] : ""))) ||
        (enclosure && String(enclosure["@_type"] ?? "").startsWith("image") && enclosure["@_url"]) ||
        "";
      const rawDesc = text(item.description ?? item.summary).replace(/<[^>]*>/g, "").trim();
      const excerpt = rawDesc.replace(/^\s*Update\s*/i, "").slice(0, 150) + (rawDesc.length > 150 ? "…" : "");
      const link =
        typeof item.link === "string"
          ? item.link
          : (item.link?.["@_href"] ?? (Array.isArray(item.link) ? item.link[0]?.["@_href"] : "")) || "";
      return {
        title: text(item.title).trim(),
        link: String(link).trim(),
        date: text(item.pubDate ?? item.published ?? item.updated).trim(),
        thumb: String(thumb || ""),
        excerpt,
      };
    })
    .filter((i: FeedItem) => i.title);
}

/** Baked sample articles from the design handoff — last-resort fallback only. */
const FALLBACK_ITEMS: FeedItem[] = [
  {
    title: "10 Essential Factors to Evaluate Before Selling Your Business",
    date: "2026-07-03",
    link: "https://ceo-advisory-group.com/newsletter/10-essential-factors-to-evaluate-before-selling-your-business",
    thumb: "",
    excerpt:
      "In today's challenging economic environment, the decision to sell your business shouldn't be taken lightly. Knowing why you're selling is the first step.",
  },
  {
    title: "Unlock Enduring Leadership Success: Five Key Choices for Leaders",
    date: "2026-07-02",
    link: "https://ceo-advisory-group.com/newsletter/unlock-enduring-leadership-success-five-key-choices-for-leaders",
    thumb: "",
    excerpt:
      "True success runs deeper than accolades and milestones — it is grounded in the choices leaders make every day.",
  },
  {
    title: "Small Business Confidence Soars to Record High Despite Rising Wage Pressures",
    date: "2026-06-29",
    link: "https://ceo-advisory-group.com/newsletter/small-business-confidence-soars-to-record-high-despite-rising-wage-pressures",
    thumb: "",
    excerpt:
      "Small business confidence is reaching unprecedented heights, according to the latest MetLife and U.S. Chamber of Commerce survey.",
  },
];
