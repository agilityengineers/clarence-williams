import { useQuery } from "@tanstack/react-query";
import type { z } from "zod/v4";
import type { authorArchiveSchema, authorFeaturedSchema } from "@/lib/sections/schemas";
import { apiGet } from "@/lib/api";
import { Eyebrow, mediaUrl } from "./shared";

type FeaturedContent = z.infer<typeof authorFeaturedSchema>;
type ArchiveContent = z.infer<typeof authorArchiveSchema>;

type Book = {
  id: string;
  title: string;
  blurb: string;
  coverMediaId: string | null;
  primaryUrl: string;
  amazonUrl: string;
  featured: boolean;
  position: number;
  createdAt: string;
};

function useBooks() {
  return useQuery({
    queryKey: ["books"],
    queryFn: () => apiGet<{ books: Book[] }>("/public/books"),
    staleTime: 60_000,
  });
}

/** Featured-book hero: 620×780 cover with offset gold frame + title/blurb/buttons. */
export default function AuthorFeaturedSection({ content }: { content: FeaturedContent }) {
  const { data } = useBooks();
  // Books arrive newest-first; the featured hero uses the newest featured book.
  const book = data?.books.find((b) => b.featured) ?? null;
  if (!book) return null;
  const [first, ...rest] = book.title.split(" ");
  const restTitle = rest.join(" ");

  return (
    <section className="bg-navy font-sans text-dark-ivory">
      <div className="mx-auto grid max-w-[1920px] items-center gap-12 px-6 pb-16 pt-16 md:gap-14 md:pb-[100px] md:pt-[110px] lg:grid-cols-[620px_1fr] lg:gap-[100px] lg:px-[100px]">
        <div className="flex flex-col gap-6">
          <div className="relative max-w-[620px]">
            <div aria-hidden className="absolute left-6 top-6 h-full w-full border border-gold" />
            <div className="relative flex aspect-[620/780] w-full items-center justify-center overflow-hidden bg-navy-panel-hover">
              {book.coverMediaId ? (
                <img
                  src={mediaUrl(book.coverMediaId, "")}
                  alt={`${book.title} cover`}
                  width={620}
                  height={780}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="px-8 text-center text-[14px] tracking-[0.12em] text-dark-faint">
                  COVER COMING SOON — UPLOAD FROM THE ADMIN DASHBOARD
                </span>
              )}
            </div>
          </div>
          <div className="mt-6 flex max-w-[620px] justify-between text-[11px] tracking-[0.26em] text-dark-faint">
            <span>LATEST RELEASE</span>
            <span>MANAGED BY ADMIN</span>
          </div>
        </div>

        <div className="flex flex-col items-start">
          <Eyebrow tone="dark">{content.eyebrow}</Eyebrow>
          <h1 className="mt-[30px] font-display text-[42px] font-medium leading-[1.06] sm:text-[52px] md:text-[96px] md:leading-[1.04]">
            {first} <span className="italic text-gold">{restTitle}</span>
          </h1>
          <div className="mt-[22px] text-[13px] font-medium tracking-[0.22em] text-dark-muted md:text-[15px] md:tracking-[0.28em]">
            THE NEW BOOK FROM CLARENCE WILLIAMS
          </div>
          <p className="mt-7 max-w-[720px] text-[18px] leading-[1.7] text-dark-muted md:mt-9 md:text-[21px]" style={{ textWrap: "pretty" }}>
            {book.blurb}
          </p>
          <div className="mt-10 flex w-full flex-wrap gap-4 md:mt-12 md:w-auto md:gap-5">
            {book.primaryUrl ? (
              <a
                href={book.primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gold px-10 py-5 text-center text-[15px] font-semibold tracking-[0.14em] text-on-gold transition-opacity hover:opacity-90 max-sm:w-full"
              >
                VISIT {hostLabel(book.primaryUrl)}
              </a>
            ) : null}
            {book.amazonUrl ? (
              <a
                href={book.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-dark-muted px-10 py-5 text-center text-[15px] font-semibold tracking-[0.14em] text-dark-ivory transition-colors hover:border-gold max-sm:w-full"
              >
                BUY ON AMAZON
              </a>
            ) : null}
          </div>
          <span className="mt-[26px] text-[13px] text-dark-faint">
            Purchase links are managed from the admin dashboard.
          </span>
        </div>
      </div>
    </section>
  );
}

/** Ivory "From the archive" band — past books as one group, never itemized. */
export function AuthorArchiveSection({ content }: { content: ArchiveContent }) {
  const headline = content.headline;
  const words = headline.split(" ");
  const tail = words.splice(Math.max(words.length - 3, 1)).join(" ");

  return (
    <section className="bg-ivory font-sans text-ink">
      <div className="mx-auto max-w-[1920px] px-6 pb-16 pt-16 md:pb-24 md:pt-[100px] lg:px-[100px]">
        <div className="flex items-baseline justify-between">
          <Eyebrow tone="light">{content.eyebrow}</Eyebrow>
          <span className="text-[12px] tracking-[0.14em] text-ink-faint max-md:hidden">
            MANAGED BY ADMIN
          </span>
        </div>
        <div className="mt-9 grid items-center gap-12 md:mt-12 md:gap-14 lg:grid-cols-[1fr_760px] lg:gap-[100px]">
          <div className="flex flex-col items-start">
            <h2 className="m-0 font-display text-[34px] font-medium leading-[1.12] sm:text-[40px] md:text-[64px] md:leading-[1.1]">
              {words.join(" ")} <span className="italic text-bronze">{tail}</span>
            </h2>
            <p className="mt-6 max-w-[680px] text-[17px] leading-[1.7] text-ink-body md:mt-7 md:text-[19px]" style={{ textWrap: "pretty" }}>
              {content.blurb}
            </p>
            {content.amazonUrl ? (
              <a
                href={content.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-9 border-b border-bronze pb-1 text-[13px] tracking-[0.18em] text-bronze transition-opacity hover:opacity-75"
              >
                FIND THEM ON AMAZON →
              </a>
            ) : null}
          </div>
          <div className="flex flex-col gap-[18px]">
            <div className="flex aspect-[760/460] w-full items-center justify-center overflow-hidden border border-rule-light bg-white">
              {content.groupPhotoMediaId ? (
                <img
                  src={mediaUrl(content.groupPhotoMediaId, "")}
                  alt="Collected earlier books"
                  width={760}
                  height={460}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="px-8 text-center text-[13px] tracking-[0.12em] text-ink-faint">
                  GROUP PHOTO COMING SOON — UPLOAD FROM THE ADMIN DASHBOARD
                </span>
              )}
            </div>
            <span className="self-end text-[11px] tracking-[0.26em] text-ink-faint">
              THE COLLECTED WORKS — FIG. 02
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toUpperCase();
  } catch {
    return "WEBSITE";
  }
}
