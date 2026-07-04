import type { z } from "zod/v4";
import type { proofSchema } from "@/lib/sections/schemas";
import { Eyebrow } from "./shared";

type ProofContent = z.infer<typeof proofSchema>;

export default function ProofSection({ content }: { content: ProofContent }) {
  return (
    <section id="proof" className="bg-navy font-sans text-dark-ivory">
      <div className="mx-auto max-w-[1920px] px-6 pb-16 pt-16 md:pb-[100px] md:pt-[110px] lg:px-[100px]">
        <Eyebrow tone="dark">{content.eyebrow}</Eyebrow>

        <div className="mt-10 grid gap-10 md:mt-16 md:grid-cols-3 md:gap-16">
          {content.metrics.map((m) => (
            <div key={m.label} className="border-t border-navy-rule pt-7 md:pt-8">
              <div className="font-display text-[48px] leading-none text-gold md:text-[56px] lg:text-[88px]">
                <MetricValue value={m.value} />
              </div>
              <div className="mt-[18px] text-[18px] font-semibold">{m.label}</div>
              <div className="mt-2.5 text-[15px] leading-[1.65] text-dark-muted" style={{ textWrap: "pretty" }}>
                {m.body}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-6 md:mt-[88px] md:grid-cols-3 md:gap-10">
          {content.testimonials.map((t) => (
            <figure key={t.attribution} className="m-0 flex flex-col gap-5 border border-navy-rule px-6 py-8 md:gap-6 md:px-9 md:py-10">
              <span aria-hidden className="font-display text-[54px] leading-[0.5] text-gold">
                &ldquo;
              </span>
              <blockquote
                className="m-0 font-display text-[21px] italic leading-[1.5] md:text-[23px]"
                style={{ textWrap: "pretty" }}
              >
                {t.quote}
              </blockquote>
              <figcaption className="mt-auto text-[13px] tracking-[0.18em] text-dark-muted">
                {t.attribution}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/** "200%+" → suffix half-size; "90d→24h" → arrow half-size, per design. */
function MetricValue({ value }: { value: string }) {
  const arrowMatch = value.match(/^(.+?)(→)(.+)$/);
  if (arrowMatch) {
    return (
      <>
        {arrowMatch[1].trim()} <span className="text-[0.5em]">→</span> {arrowMatch[3].trim()}
      </>
    );
  }
  const suffixMatch = value.match(/^(.+?)([+↑])$/);
  if (suffixMatch) {
    return (
      <>
        {suffixMatch[1]}
        <span className="text-[0.5em]">{suffixMatch[2]}</span>
      </>
    );
  }
  return <>{value}</>;
}
