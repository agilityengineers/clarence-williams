import type { z } from "zod/v4";
import type { venturesSchema } from "@/lib/sections/schemas";
import { Eyebrow } from "./shared";

type VenturesContent = z.infer<typeof venturesSchema>;

export default function VenturesSection({ content }: { content: VenturesContent }) {
  const count = Math.max(content.brands.length, 1);
  return (
    <section id="ventures" className="bg-ivory font-sans text-ink">
      <div className="mx-auto max-w-[1920px] px-6 py-14 md:py-[84px] lg:px-[100px]">
        <div className="flex items-baseline justify-between">
          <Eyebrow tone="light">{content.eyebrow}</Eyebrow>
          <span className="text-[12px] tracking-[0.14em] text-ink-faint max-md:hidden">
            MANAGED BY ADMIN
          </span>
        </div>
        <div
          className="mt-9 grid border-y border-rule-light max-lg:grid-cols-1 md:mt-12"
          style={{ gridTemplateColumns: undefined }}
        >
          <div className="grid lg:hidden">
            {content.brands.map((b) => (
              <BrandCell key={b.name} brand={b} className="border-b border-rule-light px-0 py-8 last:border-b-0" />
            ))}
          </div>
          <div className="hidden lg:grid" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
            {content.brands.map((b, i) => (
              <BrandCell
                key={b.name}
                brand={b}
                className={`py-11 ${i === 0 ? "pr-9" : i === count - 1 ? "border-l border-rule-light pl-9" : "border-l border-rule-light px-9"}`}
              />
            ))}
          </div>
        </div>
        <div className="mt-6 max-w-[1100px] text-[12px] leading-[1.6] text-ink-faint">
          {content.disclaimer}
        </div>
      </div>
    </section>
  );
}

function BrandCell({
  brand,
  className,
}: {
  brand: { name: string; tagline: string; url: string };
  className: string;
}) {
  const mark = <Wordmark name={brand.name} />;
  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {brand.url ? (
        <a href={brand.url} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-75">
          {mark}
        </a>
      ) : (
        mark
      )}
      <span className="text-[12px] tracking-[0.2em] text-ink-muted">{brand.tagline}</span>
    </div>
  );
}

/**
 * Bespoke wordmark lockups from the design for the four launch brands;
 * admin-added brands fall back to the serif treatment.
 */
function Wordmark({ name }: { name: string }) {
  switch (name) {
    case "CEO Advisory Group":
      return (
        <span className="text-[22px] font-bold leading-[1.3] tracking-[0.12em]">
          CEO ADVISORY
          <br />
          GROUP
        </span>
      );
    case "Vistage Chair":
      return (
        <span className="font-display text-[32px] italic">
          Vistage{" "}
          <span className="font-sans text-[14px] not-italic tracking-[0.22em] text-bronze">CHAIR</span>
        </span>
      );
    case "Find a Business Pro!":
      return (
        <span className="text-[24px] font-semibold tracking-[0.04em]">
          Find a Business Pro<span className="text-bronze">!</span>
        </span>
      );
    default: {
      // "Agility Engineers" style: serif, last word bronze.
      const words = name.split(" ");
      const last = words.length > 1 ? words.pop() : null;
      return (
        <span className="font-display text-[32px] tracking-[0.02em]">
          {words.join(" ")}
          {last ? (
            <>
              {" "}
              <span className="text-bronze">{last}</span>
            </>
          ) : null}
        </span>
      );
    }
  }
}
