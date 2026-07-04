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
  media,
}: {
  type: string;
  schema: Record<string, unknown>;
  initialValue: unknown;
  media: MediaOption[];
}) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiPut(`/admin/sections/${type}`, value);
      setSaving(false);
      setMessage("Saved. The live site is updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "section", type] });
    } catch (err) {
      setSaving(false);
      if (err instanceof ApiError && err.status === 401) return navigate("/login");
      setError(err instanceof ApiError ? err.message : "Save failed.");
    }
  };

  return (
    <div>
      <SchemaForm schema={schema} value={value} onChange={setValue} media={media} />
      <SaveBar saving={saving} message={message} error={error} onSave={save} />
    </div>
  );
}
