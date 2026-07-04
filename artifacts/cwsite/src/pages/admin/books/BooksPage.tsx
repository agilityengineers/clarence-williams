import { useEffect } from "react";
import { apiGet } from "@/lib/api";
import { useAdminQuery } from "../session";
import BooksManager from "./BooksManager";

type BookRow = {
  id: string;
  title: string;
  blurb: string;
  coverMediaId: string | null;
  primaryUrl: string;
  amazonUrl: string;
  featured: boolean;
};

type MediaItem = { id: string; filename: string; alt: string };

export default function BooksPage() {
  useEffect(() => {
    document.title = "Books — Admin";
  }, []);

  const booksQuery = useAdminQuery<{ books: BookRow[] }>(["admin", "books"], () =>
    apiGet<{ books: BookRow[] }>("/admin/books"),
  );
  const mediaQuery = useAdminQuery<{ items: MediaItem[] }>(["admin", "media"], () =>
    apiGet<{ items: MediaItem[] }>("/admin/media"),
  );

  const books = booksQuery.data?.books ?? [];
  const media = mediaQuery.data?.items ?? [];

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
