import Image from "next/image";
import type { z } from "zod";
import type { aboutSchema } from "@/lib/sections/schemas";
import { Eyebrow, mediaUrl } from "./shared";

type AboutContent = z.infer<typeof aboutSchema>;

export default function AboutSection({ content }: { content: AboutContent }) {
  const [locationLabel, roleLabel = "THE GUIDE"] = content.locationLine.split("—").map((s) => s.trim());
  const quote = content.quoteHeadline;
  // Last two words italic bronze, per design ("…delivering value.").
  const words = quote.split(" ");
  const tail = words.splice(Math.max(words.length - 2, 1)).join(" ");

  return (
    <section id="about" className="bg-ivory font-sans text-ink">
      <div className="mx-auto grid max-w-[1920px] gap-14 px-6 pb-[100px] pt-[110px] lg:grid-cols-[480px_1fr] lg:gap-24 lg:px-[100px]">
        {/* Portrait with offset bronze frame */}
        <div className="flex flex-col gap-6">
          <div className="relative max-w-[480px]">
            <div aria-hidden className="absolute left-6 top-6 h-full w-full border border-bronze" />
            <div className="relative flex aspect-[480/620] w-full overflow-hidden bg-ink">
              <Image
                src={mediaUrl(content.portraitMediaId, "/assets/portrait-studio.jpg")}
                alt="Clarence Williams portrait"
                width={480}
                height={620}
                className="h-full w-full object-cover"
                style={{ objectPosition: "50% 15%" }}
              />
            </div>
          </div>
          <div className="mt-6 flex max-w-[480px] justify-between text-[11px] tracking-[0.26em] text-ink-muted">
            <span>{locationLabel}</span>
            <span>{roleLabel}</span>
          </div>
        </div>

        {/* Bio */}
        <div className="flex flex-col">
          <Eyebrow tone="light">{content.eyebrow}</Eyebrow>
          <h2 className="mt-7 max-w-[1000px] font-display text-[40px] font-medium leading-[1.1] md:text-[64px]">
            &ldquo;{words.join(" ")} <span className="italic text-bronze">{tail}</span>&rdquo;
          </h2>
          {content.bioParagraphs.map((p, i) => (
            <p
              key={i}
              className={`max-w-[940px] text-[19px] leading-[1.75] text-ink-body ${i === 0 ? "mt-9" : "mt-6"}`}
              style={{ textWrap: "pretty" }}
            >
              {p}
            </p>
          ))}
          <div className="mt-[52px] grid max-w-[940px] gap-x-[60px] gap-y-5 border-t border-rule-light pt-9 md:grid-cols-2">
            {content.credentials.map((c) => (
              <div key={c.title} className="flex items-baseline gap-4">
                <span className="font-display text-[22px] text-bronze">—</span>
                <span className="text-[16px] leading-[1.5]">
                  <strong>{c.title}</strong> · {c.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
