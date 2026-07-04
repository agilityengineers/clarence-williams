import { useEffect } from "react";
import { z } from "zod/v4";
import { apiGet } from "@/lib/api";
import { useAdminQuery } from "../session";
import { siteSettingsSchema } from "../schemas";
import SettingsEditor from "./SettingsEditor";

export default function SettingsPage() {
  useEffect(() => {
    document.title = "Settings — Admin";
  }, []);

  const { data } = useAdminQuery<{ settings: unknown }>(["admin", "settings"], () =>
    apiGet<{ settings: unknown }>("/admin/settings"),
  );

  const jsonSchema = z.toJSONSchema(siteSettingsSchema) as Record<string, unknown>;

  return (
    <div>
      <h1 className="font-display text-[40px] leading-tight text-ink">Site settings</h1>
      <p className="mt-2 max-w-[700px] font-sans text-[15px] text-ink-muted">
        The Calendly URL powers every &ldquo;Book a Call&rdquo; button site-wide. Contact details
        feed the footer and contact strips.
      </p>
      <div className="mt-8 max-w-[860px]">
        {data ? (
          <SettingsEditor schema={jsonSchema} initialValue={data.settings} />
        ) : (
          <p className="font-sans text-[15px] text-ink-muted">Loading…</p>
        )}
      </div>
    </div>
  );
}
