import Image from "next/image";
import { desc, eq } from "drizzle-orm";
import type { z } from "zod";
import { getDb, schema } from "@/db";
import type { authorArchiveSchema, authorFeaturedSchema } from "@/lib/sections/schemas";
import { Eyebrow, mediaUrl } from "./shared";

type FeaturedContent = z.infer<typeof authorFeaturedSchema>;
type ArchiveContent = z.infer<typeof authorArchiveSchema>;

async function getFeaturedBook() {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.books)
    .where(eq(schema.books.featured, true))
    .orderBy(desc(schema.books.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

/** Featured-book hero: 620×780 cover with offset gold frame + title/blurb/buttons. */
export default async function AuthorFeaturedSection({ content }: { content: FeaturedContent }) {
  const book = await getFeaturedBook();
  if (!book) return null;
  const [first, ...rest] = book.title.split(" ");
  const restTitle = rest.join(" ");

  return (
    <section className="bg-navy font-sans text-dark-ivory">
      <div className="mx-auto grid max-w-[1920px] items-center gap-14 px-6 pb-[100px] pt-[110px] lg:grid-cols-[620px_1fr] lg:gap-[100px] lg:px-[100px]">
        <div className="flex flex-col gap-6">
          <div className="relative max-w-[620px]">
            <div aria-hidden className="absolute left-6 top-6 h-full w-full border border-gold" />
            <div className="relative flex aspect-[620/780] w-full items-center justify-center overflow-hidden bg-navy-panel-hover">
              {book.coverMediaId ? (
                <Image
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
          <h1 className="mt-[30px] font-display text-[52px] font-medium leading-[1.04] md:text-[96px]">
            {first} <span className="italic text-gold">{restTitle}</span>
          </h1>
          <div className="mt-[22px] text-[15px] font-medium tracking-[0.28em] text-dark-muted">
            THE NEW BOOK FROM CLARENCE WILLIAMS
          </div>
          <p className="mt-9 max-w-[720px] text-[21px] leading-[1.7] text-dark-muted" style={{ textWrap: "pretty" }}>
            {book.blurb}
          </p>
          <div className="mt-12 flex flex-wrap gap-5">
            {book.primaryUrl ? (
              <a
                href={book.primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gold px-10 py-5 text-[15px] font-semibold tracking-[0.14em] text-on-gold transition-opacity hover:opacity-90"
              >
                VISIT {hostLabel(book.primaryUrl)}
              </a>
            ) : null}
            {book.amazonUrl ? (
              <a
                href={book.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-dark-muted px-10 py-5 text-[15px] font-semibold tracking-[0.14em] text-dark-ivory transition-colors hover:border-gold"
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
export async function AuthorArchiveSection({ content }: { content: ArchiveContent }) {
  const headline = content.headline;
  const words = headline.split(" ");
  const tail = words.splice(Math.max(words.length - 3, 1)).join(" ");

  return (
    <section className="bg-ivory font-sans text-ink">
      <div className="mx-auto max-w-[1920px] px-6 pb-24 pt-[100px] lg:px-[100px]">
        <div className="flex items-baseline justify-between">
          <Eyebrow tone="light">{content.eyebrow}</Eyebrow>
          <span className="text-[12px] tracking-[0.14em] text-ink-faint max-md:hidden">
            MANAGED BY ADMIN
          </span>
        </div>
        <div className="mt-12 grid items-center gap-14 lg:grid-cols-[1fr_760px] lg:gap-[100px]">
          <div className="flex flex-col items-start">
            <h2 className="m-0 font-display text-[40px] font-medium leading-[1.1] md:text-[64px]">
              {words.join(" ")} <span className="italic text-bronze">{tail}</span>
            </h2>
            <p className="mt-7 max-w-[680px] text-[19px] leading-[1.7] text-ink-body" style={{ textWrap: "pretty" }}>
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
                <Image
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
