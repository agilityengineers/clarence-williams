import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, apiDelete, apiGet, apiPost, apiUrl } from "@/lib/api";
import { useAdminQuery } from "../session";
import SaveBar from "../ui/SaveBar";

export type PageMeta = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  ogImageId: string | null;
  status: "draft" | "published";
  showInNav: boolean;
  navLabel: string;
  navOrder: number;
  includeInSitemap: boolean;
  footerStyle: "full" | "slim";
};

type MediaItem = { id: string; filename: string; alt: string };

export type SectionRow = {
  sectionType: string;
  enabled: boolean;
  overrides: Record<string, unknown> | null;
};

const insightsLayouts = ["Editorial List", "Card Grid", "Feature + List"];

export default function PageEditor({
  pageId,
  initialMeta,
  initialSections,
  sectionTypeOptions,
  isHome,
}: {
  pageId: string | null;
  initialMeta: PageMeta;
  initialSections: SectionRow[];
  sectionTypeOptions: Array<{ value: string; label: string }>;
  isHome: boolean;
}) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [meta, setMeta] = useState(initialMeta);
  const [sections, setSections] = useState<SectionRow[]>(initialSections);
  const [addType, setAddType] = useState(sectionTypeOptions[0]?.value ?? "prose");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: mediaData } = useAdminQuery<{ items: MediaItem[] }>(["admin", "media"], () =>
    apiGet<{ items: MediaItem[] }>("/admin/media"),
  );
  const media = mediaData?.items ?? [];

  const set = <K extends keyof PageMeta>(key: K, v: PageMeta[K]) =>
    setMeta((m) => ({ ...m, [key]: v }));

  const descriptionMissing = meta.status === "published" && meta.metaDescription.trim().length === 0;

  const move = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    setSections(next);
  };

  const setOverride = (i: number, key: string, value: unknown) => {
    setSections((rows) =>
      rows.map((row, ri) => {
        if (ri !== i) return row;
        const overrides = { ...(row.overrides ?? {}) };
        if (value === "" || value === null) delete overrides[key];
        else overrides[key] = value;
        return { ...row, overrides: Object.keys(overrides).length ? overrides : null };
      }),
    );
  };

  const save = async () => {
    setMessage(null);
    setError(null);
    if (descriptionMissing) {
      setError("Add a meta description before publishing this page.");
      return;
    }
    setSaving(true);
    try {
      const result = await apiPost<{ ok: boolean; id?: string }>("/admin/pages", {
        pageId,
        meta,
        sections,
      });
      setSaving(false);
      setMessage("Saved.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "pages"] });
      if (pageId) await queryClient.invalidateQueries({ queryKey: ["admin", "page", pageId] });
      if (!pageId && result.id) navigate(`/pages/${result.id}`);
    } catch (err) {
      setSaving(false);
      if (err instanceof ApiError && err.status === 401) return navigate("/login");
      setError(err instanceof ApiError ? err.message : "Save failed.");
    }
  };

  const remove = async () => {
    if (!pageId) return;
    if (!confirm(`Delete the page "/${meta.slug}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/admin/pages/${pageId}`);
      await queryClient.invalidateQueries({ queryKey: ["admin", "pages"] });
      navigate("/pages");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return navigate("/login");
      setError(err instanceof ApiError ? err.message : "Delete failed.");
    }
  };

  return (
    <div className="max-w-[900px]">
      {/* Meta */}
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Title">
          <input className={inputCls} value={meta.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Slug (URL path)">
          <input
            className={inputCls}
            value={meta.slug}
            disabled={isHome}
            onChange={(e) => set("slug", e.target.value.toLowerCase())}
          />
        </Field>
        <Field label="Meta title (SEO)">
          <input className={inputCls} value={meta.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} />
        </Field>
        <Field label="Meta description (SEO)">
          <textarea
            className={`${inputCls} resize-y ${descriptionMissing ? "border-red-500" : ""}`}
            rows={2}
            value={meta.metaDescription}
            onChange={(e) => set("metaDescription", e.target.value)}
          />
          {descriptionMissing ? (
            <span className="font-sans text-[12px] text-red-700">
              Required to publish — search engines and social previews will otherwise show the home
              page's description on this URL.
            </span>
          ) : null}
        </Field>
        <Field label="Status">
          <select className={inputCls} value={meta.status} onChange={(e) => set("status", e.target.value as "draft" | "published")}>
            <option value="published">Published</option>
            <option value="draft">Draft (hidden)</option>
          </select>
        </Field>
        <Field label="Social preview image (Open Graph)">
          <div className="flex items-center gap-4">
            <select
              className={inputCls}
              value={meta.ogImageId ?? ""}
              onChange={(e) => set("ogImageId", e.target.value === "" ? null : e.target.value)}
            >
              <option value="">— Default / sitewide image —</option>
              {media.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.filename}
                  {m.alt ? ` (${m.alt})` : ""}
                </option>
              ))}
            </select>
            {meta.ogImageId ? (
              <img
                src={apiUrl(`/media/${meta.ogImageId}`)}
                alt=""
                className="h-14 w-14 border border-rule-light object-cover"
              />
            ) : null}
          </div>
        </Field>
        <Field label="Footer style">
          <select className={inputCls} value={meta.footerStyle} onChange={(e) => set("footerStyle", e.target.value as "full" | "slim")}>
            <option value="full">Full (3-column)</option>
            <option value="slim">Slim (single strip)</option>
          </select>
        </Field>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-8">
        <Check label="Show in navigation" checked={meta.showInNav} onChange={(v) => set("showInNav", v)} />
        <Check label="Include in sitemap.xml" checked={meta.includeInSitemap} onChange={(v) => set("includeInSitemap", v)} />
        {meta.showInNav ? (
          <>
            <Field label="Nav label">
              <input className={`${inputCls} max-w-[200px]`} value={meta.navLabel} onChange={(e) => set("navLabel", e.target.value)} />
            </Field>
            <Field label="Nav order">
              <input
                type="number"
                className={`${inputCls} max-w-[100px]`}
                value={meta.navOrder}
                onChange={(e) => set("navOrder", Number(e.target.value))}
              />
            </Field>
          </>
        ) : null}
      </div>

      {/* Section stack */}
      <h2 className="mt-10 font-sans text-[14px] font-semibold uppercase tracking-[0.2em] text-ink-secondary">
        Section stack (top to bottom)
      </h2>
      <p className="mt-1 font-sans text-[13px] text-ink-muted">
        Toggle a section off to hide it on this page without losing its place. Section copy is edited
        under Section content.
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {sections.map((row, i) => (
          <li key={i} className="border border-rule-light bg-white px-4 py-3">
            <div className="flex items-center gap-4">
              <span className="w-6 text-right font-display text-[18px] text-bronze">{i + 1}</span>
              <span className="flex-1 font-sans text-[15px] font-semibold text-ink">
                {sectionTypeOptions.find((o) => o.value === row.sectionType)?.label ?? row.sectionType}
              </span>
              <Check
                label={row.enabled ? "Visible" : "Hidden"}
                checked={row.enabled}
                onChange={(v) => setSections((rows) => rows.map((r, ri) => (ri === i ? { ...r, enabled: v } : r)))}
              />
              <div className="flex gap-1">
                <MiniBtn onClick={() => move(i, -1)} disabled={i === 0} title="Move up">↑</MiniBtn>
                <MiniBtn onClick={() => move(i, 1)} disabled={i === sections.length - 1} title="Move down">↓</MiniBtn>
                <MiniBtn onClick={() => setSections((rows) => rows.filter((_, ri) => ri !== i))} title="Remove">✕</MiniBtn>
              </div>
            </div>
            {row.sectionType === "insights" ? (
              <div className="mt-3 flex flex-wrap items-end gap-5 border-t border-rule-light pt-3">
                <Field label="Display format (this placement)">
                  <select
                    className={inputCls}
                    value={String(row.overrides?.layout ?? "")}
                    onChange={(e) => setOverride(i, "layout", e.target.value)}
                  >
                    <option value="">Site default</option>
                    {insightsLayouts.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Articles shown (1–9)">
                  <input
                    type="number"
                    min={1}
                    max={9}
                    className={`${inputCls} max-w-[100px]`}
                    value={Number(row.overrides?.articleCount ?? 3)}
                    onChange={(e) => setOverride(i, "articleCount", Number(e.target.value))}
                  />
                </Field>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-3">
        <select className={`${inputCls} max-w-[320px]`} value={addType} onChange={(e) => setAddType(e.target.value)}>
          {sectionTypeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setSections((rows) => [...rows, { sectionType: addType, enabled: true, overrides: null }])}
          className="border border-rule-light px-5 py-2.5 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-secondary transition-colors hover:border-bronze hover:text-bronze"
        >
          + Add Section
        </button>
      </div>

      <SaveBar saving={saving} message={message} error={error} onSave={save} />

      {pageId && !isHome ? (
        <button
          type="button"
          onClick={remove}
          className="mt-2 font-sans text-[12px] uppercase tracking-[0.14em] text-red-700 hover:underline"
        >
          Delete this page
        </button>
      ) : null}
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

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#B0793F]" />
      <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-secondary">{label}</span>
    </label>
  );
}

function MiniBtn({ children, onClick, disabled, title }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; title: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 border border-rule-light font-sans text-[13px] text-ink-secondary transition-colors hover:border-bronze hover:text-bronze disabled:opacity-30"
    >
      {children}
    </button>
  );
}

const inputCls =
  "w-full border border-rule-light bg-white px-3.5 py-2.5 font-sans text-[15px] text-ink-body outline-none transition-colors focus:border-bronze disabled:opacity-60";
