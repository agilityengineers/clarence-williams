import type { z } from "zod";
import type { proseSchema } from "@/lib/sections/schemas";
import { Eyebrow } from "./shared";

type ProseContent = z.infer<typeof proseSchema>;

/** Generic editorial block for admin-built and AI-generated pages. */
export default function ProseSection({ content }: { content: ProseContent }) {
  const dark = content.background === "navy";
  return (
    <section className={dark ? "bg-navy font-sans text-dark-ivory" : "bg-ivory font-sans text-ink"}>
      <div className="mx-auto max-w-[1920px] px-6 pb-[100px] pt-[110px] lg:px-[100px]">
        {content.eyebrow ? <Eyebrow tone={dark ? "dark" : "light"}>{content.eyebrow}</Eyebrow> : null}
        {content.headline ? (
          <h2 className="mt-7 max-w-[1100px] font-display text-[40px] font-medium leading-[1.1] md:text-[64px]">
            {content.headline}
          </h2>
        ) : null}
        <div className="mt-9 flex max-w-[940px] flex-col gap-6">
          {content.paragraphs.map((p, i) => (
            <p
              key={i}
              className={`m-0 text-[19px] leading-[1.75] ${dark ? "text-dark-muted" : "text-ink-body"}`}
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
