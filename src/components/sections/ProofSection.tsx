import type { z } from "zod";
import type { proofSchema } from "@/lib/sections/schemas";
import { Eyebrow } from "./shared";

type ProofContent = z.infer<typeof proofSchema>;

export default function ProofSection({ content }: { content: ProofContent }) {
  return (
    <section id="proof" className="bg-navy font-sans text-dark-ivory">
      <div className="mx-auto max-w-[1920px] px-6 pb-[100px] pt-[110px] lg:px-[100px]">
        <Eyebrow tone="dark">{content.eyebrow}</Eyebrow>

        <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-16">
          {content.metrics.map((m) => (
            <div key={m.label} className="border-t border-navy-rule pt-8">
              <div className="font-display text-[56px] leading-none text-gold lg:text-[88px]">
                <MetricValue value={m.value} />
              </div>
              <div className="mt-[18px] text-[18px] font-semibold">{m.label}</div>
              <div className="mt-2.5 text-[15px] leading-[1.65] text-dark-muted" style={{ textWrap: "pretty" }}>
                {m.body}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-[88px] grid gap-10 md:grid-cols-3">
          {content.testimonials.map((t) => (
            <figure key={t.attribution} className="m-0 flex flex-col gap-6 border border-navy-rule px-9 py-10">
              <span aria-hidden className="font-display text-[54px] leading-[0.5] text-gold">
                &ldquo;
              </span>
              <blockquote
                className="m-0 font-display text-[23px] italic leading-[1.5]"
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
