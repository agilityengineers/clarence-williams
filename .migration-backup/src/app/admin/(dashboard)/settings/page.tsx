import type { Metadata } from "next";
import { z } from "zod";
import { getSiteSettings, siteSettingsSchema } from "@/lib/settings";
import SettingsEditor from "./SettingsEditor";

export const metadata: Metadata = { title: "Settings — Admin", robots: { index: false, follow: false } };

export default async function SettingsPage() {
  const settings = await getSiteSettings();
  const jsonSchema = z.toJSONSchema(siteSettingsSchema) as Record<string, unknown>;
  return (
    <div>
      <h1 className="font-display text-[40px] leading-tight text-ink">Site settings</h1>
      <p className="mt-2 max-w-[700px] font-sans text-[15px] text-ink-muted">
        The Calendly URL powers every &ldquo;Book a Call&rdquo; button site-wide. Contact details
        feed the footer and contact strips.
      </p>
      <div className="mt-8 max-w-[860px]">
        <SettingsEditor schema={jsonSchema} initialValue={settings} />
      </div>
    </div>
  );
}
