import type { z } from "zod";
import type { servicesSchema } from "@/lib/sections/schemas";
import { Eyebrow } from "./shared";

type ServicesContent = z.infer<typeof servicesSchema>;

export default function ServicesSection({ content }: { content: ServicesContent }) {
  return (
    <section id="services" className="bg-ivory font-sans text-ink">
      <div className="mx-auto max-w-[1920px] px-6 pb-[100px] pt-[110px] lg:px-[100px]">
        <Eyebrow tone="light">{content.eyebrow}</Eyebrow>
        <h2 className="mt-7 max-w-[1100px] font-display text-[44px] font-medium leading-[1.08] md:text-[72px]">
          {headlineWithItalicTail(content.headline)}
        </h2>

        <div className="mt-[72px] flex flex-col">
          {content.pillars.map((pillar, i) => (
            <div
              key={pillar.title}
              className={`grid gap-8 border-t border-rule-light py-14 lg:grid-cols-[120px_460px_1fr] lg:gap-14 ${
                i === content.pillars.length - 1 ? "border-b" : ""
              }`}
            >
              <div className="font-display text-[44px] text-bronze lg:text-[56px]">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <div className="text-[26px] font-semibold leading-[1.25] lg:text-[30px]">
                  {pillar.title}
                </div>
                <div className="mt-3 text-[15px] tracking-[0.08em] text-ink-muted">
                  {pillar.subline}
                </div>
              </div>
              <div>
                <p
                  className="m-0 max-w-[760px] text-[18px] leading-[1.7] text-ink-body"
                  style={{ textWrap: "pretty" }}
                >
                  {pillar.body}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {pillar.chips.map((chip) => (
                    <span
                      key={chip}
                      className="border border-chip-border px-4 py-[9px] text-[13px] tracking-[0.1em] text-ink-secondary"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** "Three disciplines. One clear plan." → last sentence italic bronze, per design. */
function headlineWithItalicTail(headline: string) {
  const text = headline.replace(/\n/g, " ");
  const parts = text.split(/(?<=\.)\s+/);
  if (parts.length < 2) return text;
  const tail = parts.pop();
  return (
    <>
      {parts.join(" ")} <span className="italic text-bronze">{tail}</span>
    </>
  );
}
