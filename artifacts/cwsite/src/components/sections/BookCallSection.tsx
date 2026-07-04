import { Link } from "wouter";
import type { z } from "zod/v4";
import type { bookCallSchema } from "@/lib/sections/schemas";
import { useLayoutData } from "@/lib/layout";
import { Eyebrow } from "./shared";

type BookCallContent = z.infer<typeof bookCallSchema>;

/**
 * Conversion CTA band. In the design this flows straight into the global
 * footer (rendered by SiteFooter on every page), so it carries no bottom
 * padding of its own.
 */
export default function BookCallSection({ content }: { content: BookCallContent }) {
  const { data } = useLayoutData();
  const calendlyUrl = data?.settings.calendlyUrl ?? "";
  const headline = content.headline.replace(/\n/g, " ");
  const split = headline.match(/^([\s\S]*?\.)\s*([\s\S]+)$/);

  return (
    <section id="book" className="bg-navy font-sans text-dark-ivory">
      <div className="mx-auto flex max-w-[1920px] flex-col items-center px-6 pt-[120px] text-center lg:px-[100px]">
        <Eyebrow tone="dark" centered>
          {content.eyebrow}
        </Eyebrow>
        <h2
          className="mt-[30px] max-w-[1200px] font-display text-[44px] font-medium leading-[1.1] md:text-[76px]"
          style={{ textWrap: "balance" }}
        >
          {split ? (
            <>
              {split[1]} <span className="italic text-gold">{split[2]}</span>
            </>
          ) : (
            headline
          )}
        </h2>
        <p className="mt-7 max-w-[800px] text-[20px] leading-[1.7] text-dark-muted" style={{ textWrap: "pretty" }}>
          {content.note}
        </p>
        <div className="mt-12 flex flex-wrap justify-center gap-6">
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gold px-11 py-[22px] text-[15px] font-semibold tracking-[0.14em] text-on-gold transition-opacity hover:opacity-90"
          >
            {content.primaryCta.label}
          </a>
          <Link
            href={content.secondaryCta.href}
            className="border border-dark-muted px-11 py-[22px] text-[15px] font-semibold tracking-[0.14em] text-dark-ivory transition-colors hover:border-gold"
          >
            {content.secondaryCta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
