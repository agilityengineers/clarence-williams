import type { z } from "zod/v4";
import type { proseSchema } from "@/lib/sections/schemas";
import { Eyebrow } from "./shared";

type ProseContent = z.infer<typeof proseSchema>;

/** Generic editorial block for admin-built and AI-generated pages. */
export default function ProseSection({ content }: { content: ProseContent }) {
  const dark = content.background === "navy";
  return (
    <section className={dark ? "bg-navy font-sans text-dark-ivory" : "bg-ivory font-sans text-ink"}>
      <div className="mx-auto max-w-[1920px] px-6 pb-16 pt-16 md:pb-[100px] md:pt-[110px] lg:px-[100px]">
        {content.eyebrow ? <Eyebrow tone={dark ? "dark" : "light"}>{content.eyebrow}</Eyebrow> : null}
        {content.headline ? (
          <h2 className="mt-7 max-w-[1100px] font-display text-[34px] font-medium leading-[1.12] sm:text-[40px] md:text-[64px]">
            {content.headline}
          </h2>
        ) : null}
        <div className="mt-8 flex max-w-[940px] flex-col gap-6 md:mt-9">
          {content.paragraphs.map((p, i) => (
            <p
              key={i}
              className={`m-0 text-[17px] leading-[1.75] md:text-[19px] ${dark ? "text-dark-muted" : "text-ink-body"}`}
              style={{ textWrap: "pretty" }}
            >
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
