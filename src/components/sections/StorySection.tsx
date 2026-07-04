import type { z } from "zod";
import type { storySchema } from "@/lib/sections/schemas";
import { Eyebrow } from "./shared";

type StoryContent = z.infer<typeof storySchema>;

export default function StorySection({ content }: { content: StoryContent }) {
  const headline = content.headline.replace(/\n/g, " ");
  // "Every hero needs a guide — and a plan." → the em-dash tail goes italic gold.
  const dashIndex = headline.lastIndexOf("— ");
  const [head, tail] =
    dashIndex === -1
      ? [headline, null]
      : [headline.slice(0, dashIndex + 2), headline.slice(dashIndex + 2)];

  return (
    <section id="story" className="relative overflow-hidden bg-navy font-sans text-dark-ivory">
      <div className="mx-auto max-w-[1920px] px-6 py-[110px] lg:px-[100px]">
        <Eyebrow tone="dark">{content.eyebrow}</Eyebrow>
        <div className="grid items-end gap-10 lg:grid-cols-[1fr_560px] lg:gap-20">
          <h2 className="mt-7 font-display text-[44px] font-medium leading-[1.08] md:text-[72px]">
            {head}
            {tail ? <span className="italic text-gold">{tail}</span> : null}
          </h2>
          <p className="m-0 text-[19px] leading-[1.7] text-dark-muted" style={{ textWrap: "pretty" }}>
            {content.intro}
          </p>
        </div>

        <div className="relative mt-[88px] grid gap-12 md:grid-cols-3 md:gap-16">
          <div aria-hidden className="absolute left-[60px] right-[60px] top-[27px] hidden h-px bg-navy-rule md:block" />
          {content.steps.map((step, i) => {
            const last = i === content.steps.length - 1;
            return (
              <div key={step.title} className="relative flex flex-col gap-5">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full font-display text-[24px] ${
                    last ? "bg-gold text-on-gold" : "border border-gold bg-navy text-gold"
                  }`}
                >
                  {i + 1}
                </div>
                <div className="text-[24px] font-semibold">{step.title}</div>
                <div className="max-w-[440px] text-[16px] leading-[1.65] text-dark-muted" style={{ textWrap: "pretty" }}>
                  {step.body}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
