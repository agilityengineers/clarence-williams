import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, apiPut } from "@/lib/api";
import SchemaForm, { type MediaOption } from "../ui/SchemaForm";
import SaveBar from "../ui/SaveBar";

export default function SectionContentEditor({
  type,
  schema,
  initialValue,
  initialEnabled,
  media,
}: {
  type: string;
  schema: Record<string, unknown>;
  initialValue: unknown;
  initialEnabled: boolean;
  media: MediaOption[];
}) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(initialValue);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The footer is global and always present, so it has no site-wide on/off switch.
  const canToggle = type !== "footer";

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiPut(`/admin/sections/${type}`, { content: value, enabled });
      setSaving(false);
      setMessage("Saved. The live site is updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "section", type] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "sections"] });
    } catch (err) {
      setSaving(false);
      if (err instanceof ApiError && err.status === 401) return navigate("/login");
      setError(err instanceof ApiError ? err.message : "Save failed.");
    }
  };

  return (
    <div>
      {canToggle ? (
        <label className="mb-6 flex items-center gap-3 border border-rule-light bg-white px-4 py-3.5">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 accent-[#B0793F]"
          />
          <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-secondary">
            {enabled ? "Showing on the site" : "Hidden site-wide"}
          </span>
          <span className="font-sans text-[13px] text-ink-muted">
            {enabled
              ? "Uncheck to hide this section everywhere it appears."
              : "This section is hidden on every page until you turn it back on."}
          </span>
        </label>
      ) : null}
      <SchemaForm schema={schema} value={value} onChange={setValue} media={media} />
      <SaveBar saving={saving} message={message} error={error} onSave={save} />
    </div>
  );
}
