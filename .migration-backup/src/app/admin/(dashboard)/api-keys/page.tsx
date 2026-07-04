import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import ApiKeysManager from "./ApiKeysManager";

export const metadata: Metadata = { title: "API Keys — Admin", robots: { index: false, follow: false } };

export default async function ApiKeysPage() {
  const db = await getDb();
  const keys = await db.select().from(schema.apiKeys).orderBy(desc(schema.apiKeys.createdAt));
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
            createdAt: k.createdAt.toISOString(),
            lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
            revokedAt: k.revokedAt?.toISOString() ?? null,
          }))}
        />
      </div>
    </div>
  );
}
