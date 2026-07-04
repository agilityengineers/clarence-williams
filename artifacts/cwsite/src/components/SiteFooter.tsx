import { Link } from "wouter";
import { assetUrl } from "@/lib/api";
import { useLayoutData } from "@/lib/layout";

/**
 * Global footer (Pages = Nav + sections + Footer). The full variant is the
 * design's 3-column footer + legal bar; the slim variant is the single-strip
 * footer used on the Resume page.
 */
export default function SiteFooter({ variant = "full" }: { variant?: "full" | "slim" }) {
  const { data } = useLayoutData();
  if (!data || !data.footer) return null;
  const footer = data.footer;
  const { contact } = data.settings;
  const [addressLine, cityLine] = splitAddress(contact.address);
  const year = new Date().getFullYear();

  if (variant === "slim") {
    return (
      <footer className="bg-navy font-sans text-dark-faint">
        <div className="mx-auto flex max-w-[1920px] flex-col items-center justify-between gap-4 border-t border-navy-rule px-6 py-8 text-[12px] tracking-[0.12em] md:flex-row lg:px-[100px]">
          <div className="flex items-center gap-4">
            <img src={assetUrl("/assets/logo-gold.png")} alt="CW monogram" width={24} height={24} className="h-6 w-6 object-contain" />
            <span>© {year} CLARENCEWILLIAMS.COM</span>
          </div>
          <span className="flex flex-col items-center gap-1 text-center uppercase md:flex-row md:gap-2">
            <span className="break-all">{contact.email}</span>
            <span className="max-md:hidden">·</span>
            <span>{contact.phone}</span>
          </span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-navy px-6 font-sans text-dark-muted lg:px-[100px]">
      <div className="mx-auto max-w-[1720px]">
        <div className="grid gap-10 border-t border-navy-rule py-12 md:gap-12 md:py-14 md:pb-12 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-20">
          <div className="flex flex-col gap-[18px]">
            <div className="flex items-center gap-4 sm:gap-5">
              <img
                src={assetUrl("/assets/logo-gold.png")}
                alt="Clarence Williams monogram"
                width={34}
                height={34}
                className="h-7 w-7 shrink-0 object-contain sm:h-[34px] sm:w-[34px]"
              />
              <span className="whitespace-nowrap font-display text-[26px] font-medium leading-none text-dark-ivory sm:text-[34px]">
                Clarence <span className="italic text-gold">Williams</span>
              </span>
            </div>
            <p className="m-0 max-w-[520px] font-display text-[21px] italic leading-[1.5] text-dark-muted" style={{ textWrap: "pretty" }}>
              &ldquo;{footer.quote}&rdquo;
            </p>
          </div>

          <div className="flex flex-col gap-3.5 text-[14.5px]">
            <span className="mb-1.5 text-[12px] font-semibold tracking-[0.24em] text-dark-faint">
              PATHWAYS
            </span>
            {footer.pathways.map((p) => (
              <Link key={p.label} href={p.href} className="transition-colors hover:text-dark-ivory">
                {p.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3.5 text-[14.5px]">
            <span className="mb-1.5 text-[12px] font-semibold tracking-[0.24em] text-dark-faint">
              CONTACT
            </span>
            <a href={`mailto:${contact.email}`} className="transition-colors hover:text-dark-ivory">
              {contact.email}
            </a>
            <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`} className="transition-colors hover:text-dark-ivory">
              {contact.phone}
            </a>
            <span className="leading-[1.6]">
              {addressLine}
              {cityLine ? (
                <>
                  <br />
                  {cityLine}
                </>
              ) : null}
            </span>
            <span className="text-[13px] text-dark-faint">{footer.contactNote}</span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-navy-rule pb-7 pt-6 text-[12px] tracking-[0.08em] text-dark-faint md:flex-row">
          <span>© {year} CLARENCEWILLIAMS.COM — ALL RIGHTS RESERVED</span>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {footer.legalLinks.map((l) => (
              <Link key={l.label} href={l.href} className="transition-colors hover:text-dark-ivory">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function splitAddress(address: string): [string, string | null] {
  const m = address.match(/^(.*?),\s*(Alpharetta.*)$/);
  return m ? [m[1], m[2]] : [address, null];
}
