import { useQuery } from "@tanstack/react-query";
import type { z } from "zod/v4";
import type { insightsSchema } from "@/lib/sections/schemas";
import { apiGet } from "@/lib/api";
import { Eyebrow } from "./shared";

type FeedItem = {
  title: string;
  link: string;
  date: string;
  thumb: string;
  excerpt: string;
};
type InsightsContent = z.infer<typeof insightsSchema>;
type Article = FeedItem & { num: string; dateLabel: string };

export default function InsightsSection({ content }: { content: InsightsContent }) {
  const { data } = useQuery({
    queryKey: ["insights", content.feedUrl],
    queryFn: () =>
      apiGet<{ items: FeedItem[] }>(
        "/public/insights?feedUrl=" + encodeURIComponent(content.feedUrl),
      ),
    staleTime: 60_000,
  });
  const raw = data?.items ?? [];
  const items: Article[] = raw.slice(0, content.articleCount).map((it, i) => ({
    ...it,
    num: String(i + 1).padStart(2, "0"),
    dateLabel: formatDate(it.date),
  }));
  if (items.length === 0) return null;

  const feedHost = safeHost(content.feedUrl);
  const allArticlesUrl = feedHost ? `https://${feedHost}/newsletter/` : content.feedUrl;
  const headline = content.headline;
  const words = headline.split(" ");
  const tail = words.splice(Math.max(words.length - 1, 1)).join(" ");

  return (
    <section id="insights" className="border-t border-rule-light bg-ivory font-sans text-ink">
      <div className="mx-auto max-w-[1920px] px-6 pb-24 pt-[100px] lg:px-[100px]">
        <div className="flex items-baseline justify-between">
          <Eyebrow tone="light">{content.eyebrow}</Eyebrow>
          <span className="text-[12px] tracking-[0.14em] text-ink-faint max-md:hidden">
            RSS · {feedHost.toUpperCase()} — MANAGED BY ADMIN
          </span>
        </div>
        <div className="mt-7 flex items-end justify-between gap-8 lg:gap-16">
          <h2 className="m-0 font-display text-[40px] font-medium leading-[1.1] md:text-[64px]">
            {words.join(" ")} <span className="italic text-bronze">{tail}</span>
          </h2>
          <a
            href={allArticlesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap border-b border-bronze pb-1 text-[13px] tracking-[0.18em] text-bronze transition-opacity hover:opacity-75 max-md:hidden"
          >
            ALL ARTICLES →
          </a>
        </div>

        {content.layout === "Editorial List" && <EditorialList items={items} />}
        {content.layout === "Card Grid" && <CardGrid items={items} />}
        {content.layout === "Feature + List" && <FeatureList items={items} />}
      </div>
    </section>
  );
}

function EditorialList({ items }: { items: Article[] }) {
  return (
    <div className="mt-14 flex flex-col">
      {items.map((it) => (
        <a
          key={it.link + it.num}
          href={it.link}
          target="_blank"
          rel="noopener noreferrer"
          className="grid items-center gap-4 border-t border-rule-light py-[30px] text-ink transition-colors hover:bg-ivory-hover md:grid-cols-[90px_190px_176px_1fr_60px] md:gap-11"
        >
          <span className="font-display text-[34px] text-bronze">{it.num}</span>
          <span className="text-[13px] tracking-[0.16em] text-ink-muted">{it.dateLabel}</span>
          {it.thumb ? (
            <img src={it.thumb} alt="" className="block h-[118px] w-[176px] bg-[#E9E2D4] object-cover" loading="lazy" />
          ) : (
            <span className="block h-[118px] w-[176px] bg-[#E9E2D4]" />
          )}
          <span>
            <span className="block font-display text-[26px] font-medium leading-[1.25] md:text-[32px]">
              {it.title}
            </span>
            {it.excerpt ? (
              <span className="mt-2.5 block max-w-[900px] text-[15px] leading-[1.6] text-ink-secondary">
                {it.excerpt}
              </span>
            ) : null}
          </span>
          <span className="text-[22px] text-bronze max-md:hidden">→</span>
        </a>
      ))}
    </div>
  );
}

function CardGrid({ items }: { items: Article[] }) {
  return (
    <div className="mt-14 grid gap-9 md:grid-cols-3">
      {items.map((it) => (
        <a
          key={it.link + it.num}
          href={it.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col border border-rule-light bg-white text-ink transition-colors hover:border-bronze"
        >
          {it.thumb ? (
            <img src={it.thumb} alt="" className="block h-[240px] w-full bg-[#E9E2D4] object-cover" loading="lazy" />
          ) : (
            <span className="block h-[240px] w-full bg-[#E9E2D4]" />
          )}
          <span className="flex flex-col gap-3.5 px-[30px] pb-[34px] pt-[30px]">
            <span className="text-[12px] tracking-[0.16em] text-ink-muted">{it.dateLabel}</span>
            <span className="font-display text-[27px] font-medium leading-[1.3]">{it.title}</span>
            <span className="mt-1.5 text-[13px] tracking-[0.16em] text-bronze">READ →</span>
          </span>
        </a>
      ))}
    </div>
  );
}

function FeatureList({ items }: { items: Article[] }) {
  const [feature, ...rest] = items;
  return (
    <div className="mt-14 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-[72px]">
      <a
        href={feature.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col text-ink"
      >
        {feature.thumb ? (
          <img src={feature.thumb} alt="" className="block h-[420px] w-full bg-[#E9E2D4] object-cover" loading="lazy" />
        ) : (
          <span className="block h-[420px] w-full bg-[#E9E2D4]" />
        )}
        <span className="mt-[26px] text-[12px] tracking-[0.16em] text-ink-muted">
          {feature.dateLabel} — FEATURED
        </span>
        <span className="mt-3.5 font-display text-[34px] font-medium leading-[1.2] md:text-[42px]">
          {feature.title}
        </span>
        {feature.excerpt ? (
          <span className="mt-3.5 text-[16px] leading-[1.65] text-ink-secondary">{feature.excerpt}</span>
        ) : null}
      </a>
      <div className="flex flex-col">
        {rest.map((it) => (
          <a
            key={it.link + it.num}
            href={it.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-2.5 border-t border-rule-light py-7 text-ink transition-colors hover:bg-ivory-hover"
          >
            <span className="text-[12px] tracking-[0.16em] text-ink-muted">{it.dateLabel}</span>
            <span className="font-display text-[27px] font-medium leading-[1.3]">{it.title}</span>
            <span className="text-[13px] tracking-[0.16em] text-bronze">READ →</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function formatDate(d: string): string {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return dt
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
