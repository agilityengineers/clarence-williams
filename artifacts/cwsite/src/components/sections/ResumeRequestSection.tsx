import type { z } from "zod/v4";
import type { resumeRequestSchema } from "@/lib/sections/schemas";
import { Eyebrow } from "./shared";
import ResumeRequestForm from "./ResumeRequestForm";

type ResumeContent = z.infer<typeof resumeRequestSchema>;

export default function ResumeRequestSection({ content }: { content: ResumeContent }) {
  const headline = content.headline;
  const words = headline.split(" ");
  const tail = words.splice(Math.max(words.length - 2, 1)).join(" ");

  return (
    <section className="flex-1 bg-navy font-sans text-dark-ivory">
      <div className="mx-auto grid max-w-[1920px] items-start gap-12 px-6 pb-16 pt-14 md:gap-16 md:pb-[110px] md:pt-[100px] lg:grid-cols-[1fr_760px] lg:gap-[110px] lg:px-[100px]">
        {/* Left: intro */}
        <div className="flex flex-col items-start">
          <Eyebrow tone="dark">{content.eyebrow}</Eyebrow>
          <h1
            className="mt-[30px] font-display text-[42px] font-medium leading-[1.08] sm:text-[52px] md:text-[84px] md:leading-[1.06]"
            style={{ textWrap: "balance" }}
          >
            {words.join(" ")} <span className="italic text-gold">{tail}</span>
          </h1>
          <p className="mt-7 max-w-[680px] text-[18px] leading-[1.7] text-dark-muted md:mt-8 md:text-[21px]" style={{ textWrap: "pretty" }}>
            {content.intro}
          </p>
          <div className="mt-10 flex max-w-[680px] flex-col gap-[18px] self-stretch border-t border-navy-rule pt-8 md:mt-[52px] md:pt-9">
            {content.credentialLines.map((line) => (
              <div key={line} className="flex items-baseline gap-[18px]">
                <span className="font-display text-[24px] text-gold">—</span>
                <span className="text-[17px] leading-[1.6] text-dark-ivory">{line}</span>
              </div>
            ))}
          </div>
          <span className="mt-10 text-[13px] text-dark-faint">{content.confidentialNote}</span>
        </div>

        {/* Right: request form panel */}
        <ResumeRequestForm
          formTitle={content.formTitle}
          confirmationTitle={content.confirmationTitle}
          confirmationBody={content.confirmationBody}
        />
      </div>
    </section>
  );
}
