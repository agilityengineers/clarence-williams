import type { Metadata } from "next";
import { listMedia } from "../actions";
import MediaManager from "./MediaManager";

export const metadata: Metadata = { title: "Media — Admin", robots: { index: false, follow: false } };

export default async function MediaPage() {
  const media = await listMedia();
  return (
    <div>
      <h1 className="font-display text-[40px] leading-tight text-ink">Media library</h1>
      <p className="mt-2 max-w-[700px] font-sans text-[15px] text-ink-muted">
        Portraits, book covers, and other imagery. Images are stored in the database, so they survive
        redeploys. Assign them to sections from each section&rsquo;s editor.
      </p>
      <div className="mt-8">
        <MediaManager
          items={media.map((m) => ({
            id: m.id,
            filename: m.filename,
            alt: m.alt,
            createdAt: m.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
