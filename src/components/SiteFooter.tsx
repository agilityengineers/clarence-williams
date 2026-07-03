import Image from "next/image";
import Link from "next/link";
import { getSectionContentMap } from "@/lib/pages";
import { footerSchema } from "@/lib/sections/schemas";
import { getSiteSettings } from "@/lib/settings";

/**
 * Global 3-column footer + legal bar: monogram + serif name lockup and
 * quote; pathways column; contact column. Content is admin-managed
 * (footer section content + site settings for contact details).
 */
export default async function SiteFooter() {
  const [contentMap, settings] = await Promise.all([getSectionContentMap(), getSiteSettings()]);
  const parsed = footerSchema.safeParse(contentMap.footer);
  if (!parsed.success) return null;
  const footer = parsed.data;
  const { contact } = settings;

  return (
    <footer className="bg-navy text-dark-muted">
      <div className="mx-auto grid max-w-[1920px] gap-16 border-t border-navy-rule px-6 py-20 md:grid-cols-3 lg:px-[100px]">
        <div>
          <div className="flex items-center gap-5">
            <Image
              src="/assets/logo-gold.png"
              alt="CW monogram"
              width={44}
              height={44}
              className="h-11 w-11 object-contain"
            />
            <p className="font-display text-[34px] leading-none text-dark-ivory">
              Clarence <span className="italic text-gold">Williams</span>
            </p>
          </div>
          <p className="mt-8 max-w-[380px] font-display text-[19px] italic leading-relaxed text-dark-muted">
            &ldquo;{footer.quote}&rdquo;
          </p>
        </div>

        <div>
          <h3 className="font-sans text-[14px] font-semibold uppercase tracking-[0.32em] text-dark-faint">
            Pathways
          </h3>
          <ul className="mt-7 space-y-4">
            {footer.pathways.map((p) => (
              <li key={p.label}>
                <Link
                  href={p.href}
                  className="font-sans text-[15px] text-dark-muted transition-colors hover:text-dark-ivory"
                >
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-sans text-[14px] font-semibold uppercase tracking-[0.32em] text-dark-faint">
            Contact
          </h3>
          <ul className="mt-7 space-y-4 font-sans text-[15px]">
            <li>
              <a href={`mailto:${contact.email}`} className="transition-colors hover:text-dark-ivory">
                {contact.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                className="transition-colors hover:text-dark-ivory"
              >
                {contact.phone}
              </a>
            </li>
            <li className="whitespace-pre-line">{contact.address.replace(", Alpharetta", "\nAlpharetta")}</li>
            <li className="text-dark-faint">{footer.contactNote}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-navy-rule">
        <div className="mx-auto flex max-w-[1920px] flex-col items-center justify-between gap-4 px-6 py-6 font-sans text-[12px] uppercase tracking-[0.16em] text-dark-faint md:flex-row lg:px-[100px]">
          <p>© {new Date().getFullYear()} ClarenceWilliams.com — All rights reserved</p>
          <ul className="flex gap-8">
            {footer.legalLinks.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="transition-colors hover:text-dark-ivory">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
