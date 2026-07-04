/**
 * Schema-driven form renderer: takes the JSON Schema of a section content
 * document (generated from its zod schema) and renders a full editor —
 * nested objects, repeatable arrays with reorder controls, enums, numbers,
 * booleans, media pickers for *MediaId fields. One engine gives every
 * section type a complete admin editor with no per-section code.
 */

import { apiUrl } from "@/lib/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonSchema = any;

export type MediaOption = { id: string; filename: string; alt: string };

const LONG_TEXT_KEYS =
  /(body|blurb|intro|description|quote|tagline|recommendation|disclaimer|confirmationBody|contactNote|text)$/i;

export default function SchemaForm({
  schema,
  value,
  onChange,
  media,
}: {
  schema: JsonSchema;
  value: unknown;
  onChange: (next: unknown) => void;
  media: MediaOption[];
}) {
  return <ObjectFields schema={schema} value={value} onChange={onChange} media={media} path="" />;
}

function ObjectFields({
  schema,
  value,
  onChange,
  media,
  path,
}: {
  schema: JsonSchema;
  value: unknown;
  onChange: (next: unknown) => void;
  media: MediaOption[];
  path: string;
}) {
  const obj = (value ?? {}) as Record<string, unknown>;
  const props = schema.properties ?? {};
  return (
    <div className="flex flex-col gap-6">
      {Object.entries(props).map(([key, propSchema]) => (
        <FieldRenderer
          key={key}
          name={key}
          schema={propSchema as JsonSchema}
          value={obj[key]}
          onChange={(v) => onChange({ ...obj, [key]: v })}
          media={media}
          path={path ? `${path}.${key}` : key}
        />
      ))}
    </div>
  );
}

function FieldRenderer({
  name,
  schema,
  value,
  onChange,
  media,
  path,
}: {
  name: string;
  schema: JsonSchema;
  value: unknown;
  onChange: (next: unknown) => void;
  media: MediaOption[];
  path: string;
}) {
  const label = humanize(name);

  // Nullable string (anyOf [string, null]) — media ids and optional strings.
  const anyOf = schema.anyOf as JsonSchema[] | undefined;
  const isNullableString =
    anyOf && anyOf.some((s) => s.type === "string") && anyOf.some((s) => s.type === "null");

  if (/mediaid$/i.test(name) && (isNullableString || schema.type === "string")) {
    return (
      <Labeled label={label}>
        <MediaSelect value={(value as string | null) ?? null} onChange={onChange} media={media} />
      </Labeled>
    );
  }

  if (isNullableString) {
    return (
      <Labeled label={label}>
        <input
          className={inputCls}
          value={(value as string | null) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        />
      </Labeled>
    );
  }

  if (schema.enum) {
    return (
      <Labeled label={label}>
        <select className={inputCls} value={String(value ?? schema.enum[0])} onChange={(e) => onChange(e.target.value)}>
          {schema.enum.map((opt: string) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Labeled>
    );
  }

  switch (schema.type) {
    case "string": {
      const long = LONG_TEXT_KEYS.test(name) || String(value ?? "").length > 90;
      return (
        <Labeled label={label}>
          {long ? (
            <textarea
              className={`${inputCls} resize-y`}
              rows={3}
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
            />
          ) : (
            <input className={inputCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
          )}
        </Labeled>
      );
    }
    case "number":
    case "integer":
      return (
        <Labeled label={label + rangeHint(schema)}>
          <input
            type="number"
            className={`${inputCls} max-w-[160px]`}
            value={Number(value ?? schema.minimum ?? 0)}
            min={schema.minimum}
            max={schema.maximum}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </Labeled>
      );
    case "boolean":
      return (
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 accent-[#B0793F]"
          />
          <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-secondary">
            {label}
          </span>
        </label>
      );
    case "array":
      return (
        <ArrayField
          label={label}
          schema={schema}
          value={(value as unknown[]) ?? []}
          onChange={onChange}
          media={media}
          path={path}
        />
      );
    case "object":
      return (
        <fieldset className="border border-rule-light p-5">
          <legend className="px-2 font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            {label}
          </legend>
          <ObjectFields schema={schema} value={value} onChange={onChange} media={media} path={path} />
        </fieldset>
      );
    default:
      return null;
  }
}

function ArrayField({
  label,
  schema,
  value,
  onChange,
  media,
  path,
}: {
  label: string;
  schema: JsonSchema;
  value: unknown[];
  onChange: (next: unknown[]) => void;
  media: MediaOption[];
  path: string;
}) {
  const itemSchema = schema.items as JsonSchema;
  const canAdd = schema.maxItems === undefined || value.length < schema.maxItems;
  const canRemove = schema.minItems === undefined || value.length > schema.minItems;
  const fixed = schema.minItems !== undefined && schema.minItems === schema.maxItems;

  const move = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <fieldset className="border border-rule-light p-5">
      <legend className="px-2 font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </legend>
      <div className="flex flex-col gap-4">
        {value.map((item, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex-1">
              {itemSchema.type === "object" ? (
                <div className="border border-rule-light bg-white p-4">
                  <ObjectFields
                    schema={itemSchema}
                    value={item}
                    onChange={(v) => onChange(value.map((x, xi) => (xi === i ? v : x)))}
                    media={media}
                    path={`${path}[${i}]`}
                  />
                </div>
              ) : (
                <input
                  className={inputCls}
                  value={String(item ?? "")}
                  onChange={(e) => onChange(value.map((x, xi) => (xi === i ? e.target.value : x)))}
                />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <MiniBtn onClick={() => move(i, -1)} disabled={i === 0} title="Move up">↑</MiniBtn>
              <MiniBtn onClick={() => move(i, 1)} disabled={i === value.length - 1} title="Move down">↓</MiniBtn>
              {!fixed && (
                <MiniBtn
                  onClick={() => canRemove && onChange(value.filter((_, xi) => xi !== i))}
                  disabled={!canRemove}
                  title="Remove"
                >
                  ✕
                </MiniBtn>
              )}
            </div>
          </div>
        ))}
        {!fixed && canAdd ? (
          <button
            type="button"
            onClick={() => onChange([...value, emptyValue(itemSchema)])}
            className="self-start border border-rule-light px-4 py-2 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-secondary transition-colors hover:border-bronze hover:text-bronze"
          >
            + Add {label.replace(/s$/, "")}
          </button>
        ) : null}
      </div>
    </fieldset>
  );
}

function MediaSelect({
  value,
  onChange,
  media,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  media: MediaOption[];
}) {
  return (
    <div className="flex items-center gap-4">
      <select
        className={inputCls}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
      >
        <option value="">— Default / none —</option>
        {media.map((m) => (
          <option key={m.id} value={m.id}>
            {m.filename}
            {m.alt ? ` (${m.alt})` : ""}
          </option>
        ))}
      </select>
      {value ? (
        <img src={apiUrl(`/media/${value}`)} alt="" className="h-14 w-14 border border-rule-light object-cover" />
      ) : null}
    </div>
  );
}

function MiniBtn({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="h-7 w-7 border border-rule-light font-sans text-[12px] text-ink-secondary transition-colors hover:border-bronze hover:text-bronze disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

export function emptyValue(schema: JsonSchema): unknown {
  if (schema.enum) return schema.enum[0];
  switch (schema.type) {
    case "string":
      return "";
    case "number":
    case "integer":
      return schema.minimum ?? 0;
    case "boolean":
      return false;
    case "array":
      return Array.from({ length: schema.minItems ?? 0 }, () => emptyValue(schema.items));
    case "object": {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(schema.properties ?? {})) out[k] = emptyValue(v as JsonSchema);
      return out;
    }
    default: {
      const anyOf = schema.anyOf as JsonSchema[] | undefined;
      if (anyOf?.some((s: JsonSchema) => s.type === "null")) return null;
      return "";
    }
  }
}

function humanize(key: string): string {
  const spaced = key
    .replace(/MediaId$/i, "Image")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\bCta\b/g, "CTA")
    .replace(/\bUrl\b/g, "URL");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function rangeHint(schema: JsonSchema): string {
  if (schema.minimum !== undefined && schema.maximum !== undefined) {
    return ` (${schema.minimum}–${schema.maximum})`;
  }
  return "";
}

const inputCls =
  "w-full border border-rule-light bg-white px-3.5 py-2.5 font-sans text-[15px] text-ink-body outline-none transition-colors focus:border-bronze";
