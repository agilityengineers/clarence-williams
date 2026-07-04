import { useEffect } from "react";
import { apiGet } from "@/lib/api";
import { useAdminQuery } from "../session";
import MediaManager from "./MediaManager";

type MediaItem = { id: string; filename: string; alt: string; createdAt: string };

export default function MediaPage() {
  useEffect(() => {
    document.title = "Media — Admin";
  }, []);

  const { data } = useAdminQuery<{ items: MediaItem[] }>(["admin", "media"], () =>
    apiGet<{ items: MediaItem[] }>("/admin/media"),
  );
  const items = data?.items ?? [];

  return (
    <div>
      <h1 className="font-display text-[40px] leading-tight text-ink">Media library</h1>
      <p className="mt-2 max-w-[700px] font-sans text-[15px] text-ink-muted">
        Portraits, book covers, and other imagery. Images are stored in the database, so they survive
        redeploys. Assign them to sections from each section&rsquo;s editor.
      </p>
      <div className="mt-8">
        <MediaManager
          items={items.map((m) => ({
            id: m.id,
            filename: m.filename,
            alt: m.alt,
            createdAt: new Date(m.createdAt).toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
