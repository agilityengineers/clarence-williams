import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, apiPost } from "@/lib/api";

type Key = {
  id: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export default function ApiKeysManager({ keys }: { keys: Key[] }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [minted, setMinted] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "api-keys"] });

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await apiPost<{ ok: boolean; token?: string }>("/admin/api-keys", { label });
      setBusy(false);
      setMinted(result.token ?? null);
      setLabel("");
      await refresh();
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.status === 401) return navigate("/login");
      setError(err instanceof ApiError ? err.message : "Failed.");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 border border-rule-light bg-white p-5">
        <label className="flex flex-col gap-2">
          <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Key label (e.g. &ldquo;Claude page generator&rdquo;)
          </span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-[320px] border border-rule-light bg-white px-3.5 py-2.5 font-sans text-[15px] outline-none focus:border-bronze"
          />
        </label>
        <button
          type="button"
          onClick={create}
          disabled={busy}
          className="bg-ink px-6 py-3 font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-ivory transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Generate Key
        </button>
        {error ? <span className="font-sans text-[14px] text-red-700">{error}</span> : null}
      </div>

      {minted ? (
        <div className="mt-4 border border-bronze bg-[#FBF7EC] p-5">
          <p className="font-sans text-[14px] font-semibold text-ink">
            Copy this token now — it is shown only once:
          </p>
          <code className="mt-2 block break-all bg-white p-3 font-mono text-[14px] text-ink">{minted}</code>
        </div>
      ) : null}

      <ul className="mt-8 divide-y divide-rule-light border border-rule-light bg-white">
        {keys.map((k) => (
          <li key={k.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
            <span className="font-sans text-[15px] font-semibold text-ink">{k.label}</span>
            <span className="font-sans text-[13px] text-ink-muted">
              created {new Date(k.createdAt).toLocaleDateString()}
              {k.lastUsedAt ? ` · last used ${new Date(k.lastUsedAt).toLocaleString()}` : " · never used"}
            </span>
            <span className="ml-auto">
              {k.revokedAt ? (
                <span className="bg-red-100 px-2 py-1 font-sans text-[11px] uppercase tracking-[0.12em] text-red-900">
                  Revoked
                </span>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(`Revoke "${k.label}"? Tools using it will stop working.`)) return;
                    try {
                      await apiPost(`/admin/api-keys/${k.id}/revoke`);
                      await refresh();
                    } catch (err) {
                      if (err instanceof ApiError && err.status === 401) navigate("/login");
                    }
                  }}
                  className="font-sans text-[12px] uppercase tracking-[0.14em] text-red-700 hover:underline"
                >
                  Revoke
                </button>
              )}
            </span>
          </li>
        ))}
        {keys.length === 0 ? (
          <li className="px-5 py-4 font-sans text-[14px] text-ink-muted">No API keys yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
