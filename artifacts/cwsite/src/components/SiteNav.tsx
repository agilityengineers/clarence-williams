import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { assetUrl } from "@/lib/api";
import { useLayoutData } from "@/lib/layout";

/**
 * Sticky site navigation: navy bar, gold monogram + wordmark left, page
 * links + gold "Book a Call" button right. Nav items come from the pages
 * table (showInNav), so the admin page builder controls them.
 *
 * Below md the links collapse into a hamburger-toggled panel (with the
 * Book-a-Call CTA inside it) so the site stays navigable on phones.
 */
export default function SiteNav({ activeSlug }: { activeSlug?: string }) {
  const { data } = useLayoutData();
  const navPages = data?.navPages ?? [];
  const calendlyUrl = data?.settings.calendlyUrl;
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <header className="sticky top-0 z-50 bg-navy border-b border-navy-rule">
      <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-3 px-4 py-3 sm:px-6 md:py-[18px] lg:px-[100px]">
        <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-5">
          <img
            src={assetUrl("/assets/logo-gold.png")}
            alt="CW monogram"
            width={36}
            height={36}
            className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
          />
          <span className="truncate font-sans text-[13px] font-semibold uppercase tracking-[0.18em] text-dark-ivory sm:text-[14px] sm:tracking-[0.24em]">
            Clarence Williams
          </span>
          <span className="font-sans text-[12px] tracking-[0.22em] text-dark-faint max-xl:hidden">
            BUSINESS STRATEGY &amp; AGILE TRANSFORMATIONS
          </span>
        </Link>

        <nav className="flex items-center gap-8">
          <ul className="hidden items-center gap-8 md:flex">
            {navPages.map((p) => {
              const href = p.slug === "home" ? "/" : `/${p.slug}`;
              const active = activeSlug === p.slug;
              return (
                <li key={p.slug}>
                  <Link
                    href={href}
                    className={`font-sans text-[13px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                      active
                        ? "text-dark-ivory underline decoration-gold decoration-2 underline-offset-8"
                        : "text-dark-muted hover:text-dark-ivory"
                    }`}
                  >
                    {p.navLabel ?? p.title}
                  </Link>
                </li>
              );
            })}
          </ul>
          {calendlyUrl ? (
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden bg-gold px-6 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-on-gold transition-opacity hover:opacity-90 md:inline-block"
            >
              BOOK A CALL
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-dark-ivory md:hidden"
          >
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                <path d="M4 4l14 14M18 4L4 18" stroke="currentColor" strokeWidth="2" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
                <path d="M2 5.5h18M2 11h18M2 16.5h18" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </button>
        </nav>
      </div>

      {menuOpen ? (
        <nav className="border-t border-navy-rule bg-navy md:hidden">
          <ul className="flex flex-col px-4 py-2 sm:px-6">
            {navPages.map((p) => {
              const href = p.slug === "home" ? "/" : `/${p.slug}`;
              const active = activeSlug === p.slug;
              return (
                <li key={p.slug} className="border-b border-navy-rule/60 last:border-b-0">
                  <Link
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`block py-4 font-sans text-[14px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                      active ? "text-gold" : "text-dark-ivory"
                    }`}
                  >
                    {p.navLabel ?? p.title}
                  </Link>
                </li>
              );
            })}
          </ul>
          {calendlyUrl ? (
            <div className="px-4 pb-5 pt-1 sm:px-6">
              <a
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gold px-6 py-4 text-center font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-on-gold transition-opacity hover:opacity-90"
              >
                BOOK A CALL
              </a>
            </div>
          ) : null}
        </nav>
      ) : null}
    </header>
  );
}
