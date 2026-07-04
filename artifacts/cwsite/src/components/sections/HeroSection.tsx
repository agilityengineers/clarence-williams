import { Link } from "wouter";
import type { z } from "zod/v4";
import type { heroSchema } from "@/lib/sections/schemas";
import { useLayoutData } from "@/lib/layout";
import { mediaUrl } from "./shared";

type HeroContent = z.infer<typeof heroSchema>;

/**
 * Approved hero — do not redesign. Full token sets for the four
 * admin-selectable background themes come from the design prototype.
 */
const THEMES: Record<
  HeroContent["theme"],
  {
    bg: string;
    ink: string;
    sub: string;
    accent: string;
    onAccent: string;
    halo: string;
    rule: string;
    steps: [string, string, string];
  }
> = {
  "Midnight Navy": {
    bg: "#0B1626", ink: "#EDE6D6", sub: "#A9B4C6", accent: "#C9A24B", onAccent: "#0B1626",
    halo: "#152238", rule: "#2A3B52", steps: ["#1B2C44", "#2A3B52", "#3A4E6B"],
  },
  Ivory: {
    bg: "#F7F4EE", ink: "#10233A", sub: "#6B675F", accent: "#B0793F", onAccent: "#F7F4EE",
    halo: "#ECE5D8", rule: "#D8D3C8", steps: ["#E3DCCD", "#D8CDB9", "#C9B694"],
  },
  "Warm Charcoal": {
    bg: "#26221E", ink: "#F1EAE0", sub: "#A79D8F", accent: "#C97E4A", onAccent: "#26221E",
    halo: "#322D27", rule: "#453E36", steps: ["#322D27", "#453E36", "#5C5248"],
  },
  Terracotta: {
    bg: "#F6EFE6", ink: "#3A2E26", sub: "#8C7A6B", accent: "#B4552D", onAccent: "#F6EFE6",
    halo: "#EFE2D2", rule: "#D8C8B4", steps: ["#E9DAC6", "#DDC5A9", "#D0AC85"],
  },
};

export default function HeroSection({ content }: { content: HeroContent }) {
  const t = THEMES[content.theme] ?? THEMES["Midnight Navy"];
  const { data } = useLayoutData();
  const calendlyUrl = data?.settings.calendlyUrl ?? "";
  const portraitSrc = mediaUrl(content.portraitMediaId, "/assets/portrait-cutout.png");

  return (
    <section
      className="relative overflow-hidden font-sans"
      style={{ background: t.bg, color: t.ink }}
    >
      <div className="relative mx-auto max-w-[1920px] xl:h-[1080px]">
        {/* Backdrop circle + offset gold ring behind portrait */}
        <div
          aria-hidden
          className="absolute rounded-full max-xl:hidden"
          style={{ right: 40, bottom: -320, width: 1040, height: 1040, background: t.halo }}
        />
        <div
          aria-hidden
          className="absolute rounded-full max-xl:hidden"
          style={{
            right: 8, bottom: -352, width: 1104, height: 1104,
            border: `1px solid ${t.accent}`, opacity: 0.55,
          }}
        />

        {/* Ascending steps motif */}
        <svg
          className="absolute bottom-0 left-6 lg:left-[100px] max-md:hidden"
          width="300" height="72" viewBox="0 0 300 72" aria-hidden
        >
          <rect x="0" y="54" width="60" height="18" fill={t.steps[0]} />
          <rect x="80" y="36" width="60" height="36" fill={t.steps[1]} />
          <rect x="160" y="18" width="60" height="54" fill={t.steps[2]} />
          <rect x="240" y="0" width="60" height="72" fill={t.accent} />
        </svg>

        {/* Hero-internal top bar */}
        <div className="flex items-center justify-between px-6 py-10 lg:px-[100px] xl:absolute xl:inset-x-0 xl:top-0 xl:z-[3]">
          <div className="font-display text-[28px] tracking-[0.08em]">
            C<span style={{ color: t.accent }}>·</span>W
          </div>
          <div
            className="flex gap-6 text-[14px] font-medium tracking-[0.18em] max-md:hidden lg:gap-11"
            style={{ color: t.sub }}
          >
            <span>CONSULTING</span>
            <span>DELIVERY</span>
            <span>BRAND</span>
            <span style={{ color: t.ink, borderBottom: `1px solid ${t.accent}`, paddingBottom: 4 }}>
              CONTACT
            </span>
          </div>
        </div>

        {/* Left content */}
        <div className="relative z-[3] flex flex-col items-start px-6 pb-16 lg:px-[100px] xl:absolute xl:left-[100px] xl:top-[200px] xl:w-[880px] xl:p-0">
          <div className="flex items-center gap-4">
            <div className="h-[2px] w-9" style={{ background: t.accent }} />
            <span className="text-[14px] font-semibold tracking-[0.32em]" style={{ color: t.sub }}>
              {content.eyebrow}
            </span>
          </div>
          <h1 className="mt-[30px] font-display text-[52px] font-medium leading-none md:text-[72px] xl:whitespace-nowrap xl:text-[96px]">
            {content.firstName}{" "}
            <span className="italic" style={{ color: t.accent }}>
              {content.lastName}
            </span>
          </h1>
          <p
            className="mt-[34px] max-w-[640px] text-[19px] leading-[1.6] md:text-[23px]"
            style={{ color: t.sub, textWrap: "pretty" }}
          >
            {content.tagline}
          </p>
          <div className="mt-11 flex flex-wrap gap-5">
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-9 py-5 text-[15px] font-semibold tracking-[0.14em] transition-opacity hover:opacity-90"
              style={{ background: t.accent, color: t.onAccent }}
            >
              {content.primaryCta.label}
            </a>
            <Link
              href={content.secondaryCta.href}
              className="px-9 py-5 text-[15px] font-semibold tracking-[0.14em] transition-opacity hover:opacity-80"
              style={{ border: `1px solid ${t.sub}`, color: t.ink }}
            >
              {content.secondaryCta.label}
            </Link>
          </div>
          {/* Pillars */}
          <div
            className="mt-[72px] flex flex-col gap-8 pt-[30px] md:flex-row md:gap-12"
            style={{ borderTop: `1px solid ${t.rule}` }}
          >
            {content.pillars.map((p, i) => (
              <div key={p.title} className="flex flex-col gap-2 md:w-[210px]">
                <span className="text-[13px] font-bold tracking-[0.16em]" style={{ color: t.accent }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[17px] font-semibold">{p.title}</span>
                <span className="text-[13.5px] leading-[1.5]" style={{ color: t.sub }}>
                  {p.subtitle}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Portrait cutout */}
        <div className="relative z-[2] mx-auto flex h-[520px] w-full max-w-[420px] items-end justify-center xl:absolute xl:bottom-0 xl:right-[120px] xl:mx-0 xl:h-[940px] xl:w-[720px] xl:max-w-none">
          <div aria-hidden className="absolute bottom-0 left-1/2 h-[420px] w-[420px] -translate-x-1/2 translate-y-1/3 rounded-full xl:hidden" style={{ background: t.halo }} />
          <img
            src={portraitSrc}
            alt={`${content.firstName} ${content.lastName}`}
            width={720}
            height={940}
            className="relative h-full w-full object-contain object-bottom"
          />
        </div>

        {/* Fig caption */}
        <div
          className="px-6 pb-6 text-center text-[12px] tracking-[0.24em] xl:absolute xl:bottom-11 xl:right-[100px] xl:z-[3] xl:p-0 xl:text-right"
          style={{ color: t.sub }}
        >
          {content.portraitCaption}
        </div>
      </div>
    </section>
  );
}
