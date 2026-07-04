import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, apiGet, apiPost, apiPut } from "@/lib/api";
import { useAdminQuery } from "../session";
import SaveBar from "../ui/SaveBar";

type TemplateValue = { subject: string; html: string };
type NotificationSettings = {
  to: string;
  from: string;
  assessment: TemplateValue;
  resume: TemplateValue;
};
type NotificationsResponse = {
  settings: NotificationSettings;
  configured: boolean;
  placeholders: Record<"assessment" | "resume", string[]>;
  defaultRecipient: string;
};

export default function NotificationsPage() {
  useEffect(() => {
    document.title = "Notifications — Admin";
  }, []);

  const { data } = useAdminQuery<NotificationsResponse>(["admin", "notifications"], () =>
    apiGet<NotificationsResponse>("/admin/notifications"),
  );

  return (
    <div>
      <h1 className="font-display text-[40px] leading-tight text-ink">Lead notifications</h1>
      <p className="mt-2 max-w-[700px] font-sans text-[15px] text-ink-muted">
        Emails sent to you when a new lead arrives — an assessment submission or a resume request.
        Edit the subject and the simple HTML body below; placeholders like{" "}
        <code className="rounded bg-paper px-1 font-mono text-[13px]">{"{{name}}"}</code> are
        replaced with the lead&rsquo;s details. Leads are always saved to the dashboard whether or
        not email is configured.
      </p>
      {data ? (
        <NotificationsEditor data={data} />
      ) : (
        <p className="mt-8 font-sans text-[15px] text-ink-muted">Loading…</p>
      )}
    </div>
  );
}

function NotificationsEditor({ data }: { data: NotificationsResponse }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [value, setValue] = useState<NotificationSettings>(data.settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<Record<string, string>>({});

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiPut("/admin/notifications", value);
      setSaving(false);
      setMessage("Saved. New lead emails use these templates.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
    } catch (err) {
      setSaving(false);
      if (err instanceof ApiError && err.status === 401) return navigate("/login");
      setError(err instanceof ApiError ? err.message : "Save failed.");
    }
  };

  const sendTest = async (kind: "assessment" | "resume") => {
    setTestStatus((s) => ({ ...s, [kind]: "Sending…" }));
    try {
      const res = await apiPost<{ ok: true; to: string }>("/admin/notifications/test", { kind });
      setTestStatus((s) => ({ ...s, [kind]: `Test email sent to ${res.to}.` }));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return navigate("/login");
      setTestStatus((s) => ({
        ...s,
        [kind]: err instanceof ApiError ? err.message : "Test send failed.",
      }));
    }
  };

  return (
    <div className="mt-8 max-w-[860px]">
      {!data.configured && (
        <div className="mb-6 border border-gold bg-paper px-5 py-4">
          <p className="font-sans text-[14px] text-ink-secondary">
            <strong>SendGrid is not configured.</strong> Leads are still saved to the dashboard,
            but no emails are sent until the <code className="font-mono text-[13px]">SENDGRID_API_KEY</code>{" "}
            secret is set for this app.
          </p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Send to"
          hint={`Leave blank to use the site contact email (${data.defaultRecipient}).`}
        >
          <input
            type="email"
            value={value.to}
            onChange={(e) => setValue({ ...value, to: e.target.value })}
            placeholder={data.defaultRecipient}
            className="w-full border border-rule bg-white px-3 py-2 font-sans text-[15px] text-ink outline-none focus:border-bronze"
          />
        </Field>
        <Field label="Send from" hint="Must be a verified sender in your SendGrid account.">
          <input
            type="email"
            value={value.from}
            onChange={(e) => setValue({ ...value, from: e.target.value })}
            className="w-full border border-rule bg-white px-3 py-2 font-sans text-[15px] text-ink outline-none focus:border-bronze"
          />
        </Field>
      </div>

      {(["assessment", "resume"] as const).map((kind) => (
        <div key={kind} className="mt-8 border border-rule bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-[24px] text-ink">
              {kind === "assessment" ? "Assessment lead email" : "Resume request email"}
            </h2>
            <button
              type="button"
              onClick={() => void sendTest(kind)}
              className="border border-rule px-4 py-2 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-secondary transition-colors hover:border-bronze hover:text-bronze"
            >
              Send test email
            </button>
          </div>
          {testStatus[kind] && (
            <p className="mt-2 font-sans text-[13px] text-ink-muted">{testStatus[kind]}</p>
          )}
          <div className="mt-4">
            <Field label="Subject">
              <input
                type="text"
                value={value[kind].subject}
                onChange={(e) =>
                  setValue({ ...value, [kind]: { ...value[kind], subject: e.target.value } })
                }
                className="w-full border border-rule bg-white px-3 py-2 font-sans text-[15px] text-ink outline-none focus:border-bronze"
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field
              label="Body (simple HTML)"
              hint={`Placeholders: ${data.placeholders[kind].join("  ")}`}
            >
              <textarea
                value={value[kind].html}
                onChange={(e) =>
                  setValue({ ...value, [kind]: { ...value[kind], html: e.target.value } })
                }
                rows={12}
                spellCheck={false}
                className="w-full border border-rule bg-white px-3 py-2 font-mono text-[13px] leading-relaxed text-ink outline-none focus:border-bronze"
              />
            </Field>
          </div>
        </div>
      ))}

      <SaveBar saving={saving} message={message} error={error} onSave={save} />
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-secondary">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1.5 font-sans text-[13px] text-ink-muted">{hint}</p>}
    </label>
  );
}
