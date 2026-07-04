import Image from "next/image";
import Link from "next/link";
import { getNavPages } from "@/lib/pages";
import { getSiteSettings } from "@/lib/settings";

/**
 * Sticky site navigation: navy bar, gold monogram + wordmark left, page
 * links + gold "Book a Call" button right. Nav items come from the pages
 * table (showInNav), so the admin page builder controls them.
 */
export default async function SiteNav({ activeSlug }: { activeSlug?: string }) {
  const [navPages, settings] = await Promise.all([getNavPages(), getSiteSettings()]);

  return (
    <header className="sticky top-0 z-50 bg-navy border-b border-navy-rule">
      <div className="mx-auto flex max-w-[1920px] items-center justify-between px-6 py-[18px] lg:px-[100px]">
        <Link href="/" className="flex items-center gap-5">
          <Image
            src="/assets/logo-gold.png"
            alt="CW monogram"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <span className="font-sans text-[14px] font-semibold uppercase tracking-[0.24em] text-dark-ivory">
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
          <a
            href={settings.calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gold px-6 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-on-gold transition-opacity hover:opacity-90"
          >
            BOOK A CALL
          </a>
        </nav>
      </div>
    </header>
  );
}
