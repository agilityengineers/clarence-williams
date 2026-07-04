"use client";

import { useState } from "react";
import { saveSettingsAction } from "../actions";
import SchemaForm from "../ui/SchemaForm";
import SaveBar from "../ui/SaveBar";

export default function SettingsEditor({
  schema,
  initialValue,
}: {
  schema: Record<string, unknown>;
  initialValue: unknown;
}) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    const result = await saveSettingsAction(value);
    setSaving(false);
    if (result.ok) setMessage("Saved. The live site is updated.");
    else setError(result.error ?? "Save failed.");
  };

  return (
    <div>
      <SchemaForm schema={schema} value={value} onChange={setValue} media={[]} />
      <SaveBar saving={saving} message={message} error={error} onSave={save} />
    </div>
  );
}
