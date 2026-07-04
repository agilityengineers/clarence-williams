import { apiUrl, assetUrl } from "@/lib/api";

/** 36×2 accent dash + tracked caps label that precedes every section headline. */
export function Eyebrow({
  children,
  tone,
  centered = false,
}: {
  children: React.ReactNode;
  tone: "dark" | "light";
  centered?: boolean;
}) {
  const dash = tone === "dark" ? "bg-gold" : "bg-bronze";
  const label = tone === "dark" ? "text-dark-muted" : "text-ink-muted";
  return (
    <div className={`flex items-center gap-4 ${centered ? "justify-center" : ""}`}>
      <div className={`h-[2px] w-9 ${dash}`} />
      <span className={`text-[14px] font-semibold tracking-[0.32em] ${label}`}>{children}</span>
      {centered ? <div className={`h-[2px] w-9 ${dash}`} /> : null}
    </div>
  );
}

/** Resolve an admin-uploaded media id to a URL, with a static fallback. */
export function mediaUrl(mediaId: string | null, fallback: string): string {
  if (mediaId) {
    return mediaId.startsWith("/")
      ? apiUrl(mediaId.replace(/^\/api/, ""))
      : apiUrl(`/media/${mediaId}`);
  }
  return fallback && fallback.startsWith("/") ? assetUrl(fallback) : fallback;
}
