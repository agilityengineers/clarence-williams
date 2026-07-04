import { useEffect } from "react";
import { apiGet } from "@/lib/api";
import { useAdminQuery } from "../session";
import ApiKeysManager from "./ApiKeysManager";

type KeyRow = {
  id: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export default function ApiKeysPage() {
  useEffect(() => {
    document.title = "API Keys — Admin";
  }, []);

  const { data } = useAdminQuery<{ keys: KeyRow[] }>(["admin", "api-keys"], () =>
    apiGet<{ keys: KeyRow[] }>("/admin/api-keys"),
  );
  const keys = data?.keys ?? [];

  return (
    <div>
      <h1 className="font-display text-[40px] leading-tight text-ink">API keys — AI page creation</h1>
      <p className="mt-2 max-w-[760px] font-sans text-[15px] text-ink-muted">
        Bearer tokens for the page-creation API used by your Anthropic/OpenAI tooling. Pages created
        through the API are unlinked by default, SEO-ready, and fully editable in the page builder.
        See <code className="bg-white px-1.5 py-0.5 text-[13px]">docs/AI-PAGE-API.md</code> in the
        repository for endpoint documentation.
      </p>
      <div className="mt-8 max-w-[860px]">
        <ApiKeysManager
          keys={keys.map((k) => ({
            id: k.id,
            label: k.label,
            createdAt: new Date(k.createdAt).toISOString(),
            lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt).toISOString() : null,
            revokedAt: k.revokedAt ? new Date(k.revokedAt).toISOString() : null,
          }))}
        />
      </div>
    </div>
  );
}
