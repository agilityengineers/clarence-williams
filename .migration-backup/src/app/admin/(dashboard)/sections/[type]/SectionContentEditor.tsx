"use client";

import { useState } from "react";
import { saveSectionContentAction } from "../../actions";
import SchemaForm, { type MediaOption } from "../../ui/SchemaForm";
import SaveBar from "../../ui/SaveBar";

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
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    const result = await saveSectionContentAction(type, value);
    setSaving(false);
    if (result.ok) setMessage("Saved. The live site is updated.");
    else setError(result.error ?? "Save failed.");
  };

  return (
    <div>
      <SchemaForm schema={schema} value={value} onChange={setValue} media={media} />
      <SaveBar saving={saving} message={message} error={error} onSave={save} />
    </div>
  );
}
