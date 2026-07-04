"use client";

export default function SaveBar({
  saving,
  message,
  error,
  onSave,
  label = "Save Changes",
}: {
  saving: boolean;
  message?: string | null;
  error?: string | null;
  onSave: () => void;
  label?: string;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 mt-8 flex items-center gap-5 border-t border-rule-light bg-ivory px-1 py-4">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="bg-ink px-8 py-3.5 font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-ivory transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving…" : label}
      </button>
      {message ? <span className="font-sans text-[14px] text-green-800">{message}</span> : null}
      {error ? <span className="font-sans text-[14px] text-red-700">{error}</span> : null}
    </div>
  );
}
