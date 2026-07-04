import type { Metadata } from "next";
import { asc, desc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { listMedia } from "../actions";
import BooksManager from "./BooksManager";

export const metadata: Metadata = { title: "Books — Admin", robots: { index: false, follow: false } };

export default async function BooksPage() {
  const db = await getDb();
  const [books, media] = await Promise.all([
    db.select().from(schema.books).orderBy(desc(schema.books.featured), asc(schema.books.position), asc(schema.books.createdAt)),
    listMedia(),
  ]);
  return (
    <div>
      <h1 className="font-display text-[40px] leading-tight text-ink">Books (Author page)</h1>
      <p className="mt-2 max-w-[700px] font-sans text-[15px] text-ink-muted">
        Exactly one book is featured on the Author page; the rest are represented by the archive
        band&rsquo;s single group photo and collective blurb (edit those under Section content →
        Author — From the Archive). Marking a new book as featured automatically rolls the previous
        one into the archive.
      </p>
      <div className="mt-8">
        <BooksManager
          books={books.map((b) => ({
            id: b.id,
            title: b.title,
            blurb: b.blurb,
            coverMediaId: b.coverMediaId,
            primaryUrl: b.primaryUrl,
            amazonUrl: b.amazonUrl,
            featured: b.featured,
          }))}
          media={media.map((m) => ({ id: m.id, filename: m.filename, alt: m.alt }))}
        />
      </div>
    </div>
  );
}
