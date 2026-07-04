"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMediaAction, uploadMediaAction } from "../actions";

type Item = { id: string; filename: string; alt: string; createdAt: string };

export default function MediaManager({ items }: { items: Item[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose an image first.");
      return;
    }
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("alt", alt);
    const result = await uploadMediaAction(fd);
    setBusy(false);
    if (!result.ok) setError(result.error ?? "Upload failed.");
    else {
      if (fileRef.current) fileRef.current.value = "";
      setAlt("");
      router.refresh();
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 border border-rule-light bg-white p-5">
        <label className="flex flex-col gap-2">
          <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Image file (PNG, JPG, WebP · max 8 MB)
          </span>
          <input ref={fileRef} type="file" accept="image/*" className="font-sans text-[14px]" />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Alt text (description)
          </span>
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            className="border border-rule-light bg-white px-3.5 py-2.5 font-sans text-[15px] outline-none focus:border-bronze"
          />
        </label>
        <button
          type="button"
          onClick={upload}
          disabled={busy}
          className="bg-ink px-6 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-ivory transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload"}
        </button>
        {error ? <span className="font-sans text-[14px] text-red-700">{error}</span> : null}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4 xl:grid-cols-6">
        {items.map((m) => (
          <figure key={m.id} className="m-0 border border-rule-light bg-white">
            <img src={`/api/media/${m.id}`} alt={m.alt} className="h-36 w-full object-cover" />
            <figcaption className="flex flex-col gap-1 p-3">
              <span className="truncate font-sans text-[13px] font-semibold text-ink" title={m.filename}>
                {m.filename}
              </span>
              <span className="font-sans text-[12px] text-ink-muted">
                {new Date(m.createdAt).toLocaleDateString()}
              </span>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`Delete ${m.filename}? Sections using it fall back to the default image.`)) return;
                  await deleteMediaAction(m.id);
                  router.refresh();
                }}
                className="self-start font-sans text-[11px] uppercase tracking-[0.12em] text-red-700 hover:underline"
              >
                Delete
              </button>
            </figcaption>
          </figure>
        ))}
        {items.length === 0 ? (
          <p className="col-span-full font-sans text-[14px] text-ink-muted">No uploads yet.</p>
        ) : null}
      </div>
    </div>
  );
}
