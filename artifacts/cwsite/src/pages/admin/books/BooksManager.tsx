import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, apiDelete, apiPost, apiUrl } from "@/lib/api";

type Book = {
  id: string | null;
  title: string;
  blurb: string;
  coverMediaId: string | null;
  primaryUrl: string;
  amazonUrl: string;
  featured: boolean;
};

type MediaOption = { id: string; filename: string; alt: string };

const emptyBook: Book = {
  id: null,
  title: "",
  blurb: "",
  coverMediaId: null,
  primaryUrl: "",
  amazonUrl: "",
  featured: false,
};

export default function BooksManager({ books, media }: { books: Book[]; media: MediaOption[] }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Book | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "books"] });

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setError(null);
    const { id, ...input } = editing;
    try {
      await apiPost("/admin/books", { bookId: id, book: input });
      setBusy(false);
      setEditing(null);
      await refresh();
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.status === 401) return navigate("/login");
      setError(err instanceof ApiError ? err.message : "Save failed.");
    }
  };

  return (
    <div>
      <ul className="flex flex-col gap-3">
        {books.map((b) => (
          <li key={b.id} className="flex items-center gap-5 border border-rule-light bg-white px-5 py-4">
            {b.coverMediaId ? (
              <img src={apiUrl(`/media/${b.coverMediaId}`)} alt="" className="h-16 w-12 border border-rule-light object-cover" />
            ) : (
              <span className="flex h-16 w-12 items-center justify-center border border-rule-light bg-ivory text-[10px] text-ink-faint">
                No cover
              </span>
            )}
            <span className="flex-1">
              <span className="font-sans text-[16px] font-semibold text-ink">{b.title}</span>
              {b.featured ? (
                <span className="ml-3 bg-[#F1E5C9] px-2 py-1 font-sans text-[11px] uppercase tracking-[0.12em] text-[#7A5A1E]">
                  Featured
                </span>
              ) : (
                <span className="ml-3 font-sans text-[12px] uppercase tracking-[0.12em] text-ink-muted">
                  In archive group
                </span>
              )}
            </span>
            <button type="button" onClick={() => setEditing(b)} className="font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-bronze hover:underline">
              Edit
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!confirm(`Delete "${b.title}"?`)) return;
                if (b.id) {
                  try {
                    await apiDelete(`/admin/books/${b.id}`);
                  } catch (err) {
                    if (err instanceof ApiError && err.status === 401) return navigate("/login");
                    setError(err instanceof ApiError ? err.message : "Delete failed.");
                    return;
                  }
                }
                await refresh();
              }}
              className="font-sans text-[12px] uppercase tracking-[0.14em] text-red-700 hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {!editing ? (
        <button
          type="button"
          onClick={() => setEditing({ ...emptyBook, featured: books.length === 0 })}
          className="mt-5 bg-ink px-6 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-ivory transition-opacity hover:opacity-90"
        >
          + Add Book
        </button>
      ) : (
        <div className="mt-6 max-w-[720px] border border-rule-light bg-white p-6">
          <h2 className="font-display text-[26px] text-ink">{editing.id ? "Edit book" : "New book"}</h2>
          <div className="mt-5 flex flex-col gap-4">
            <Field label="Title">
              <input className={inputCls} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </Field>
            <Field label="Blurb">
              <textarea className={`${inputCls} resize-y`} rows={3} value={editing.blurb} onChange={(e) => setEditing({ ...editing, blurb: e.target.value })} />
            </Field>
            <Field label="Cover image">
              <select
                className={inputCls}
                value={editing.coverMediaId ?? ""}
                onChange={(e) => setEditing({ ...editing, coverMediaId: e.target.value || null })}
              >
                <option value="">— None yet —</option>
                {media.map((m) => (
                  <option key={m.id} value={m.id}>{m.filename}</option>
                ))}
              </select>
            </Field>
            <Field label="Primary link (e.g. marketing-mayhem.com)">
              <input className={inputCls} value={editing.primaryUrl} onChange={(e) => setEditing({ ...editing, primaryUrl: e.target.value })} />
            </Field>
            <Field label="Amazon link">
              <input className={inputCls} value={editing.amazonUrl} onChange={(e) => setEditing({ ...editing, amazonUrl: e.target.value })} />
            </Field>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={editing.featured}
                onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                className="h-4 w-4 accent-[#B0793F]"
              />
              <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-secondary">
                Featured (the previous featured book rolls into the archive)
              </span>
            </label>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <button type="button" onClick={save} disabled={busy} className="bg-ink px-6 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-ivory disabled:opacity-50">
              {busy ? "Saving…" : "Save Book"}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="font-sans text-[13px] uppercase tracking-[0.14em] text-ink-muted hover:underline">
              Cancel
            </button>
            {error ? <span className="font-sans text-[14px] text-red-700">{error}</span> : null}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full border border-rule-light bg-white px-3.5 py-2.5 font-sans text-[15px] text-ink-body outline-none transition-colors focus:border-bronze";
