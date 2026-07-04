import { useState } from "react";
import { apiPost, ApiError } from "@/lib/api";

const inputClass =
  "bg-navy border border-navy-rule text-dark-ivory font-sans text-[17px] px-[18px] py-4 outline-none transition-colors focus:border-gold placeholder:text-dark-faint w-full";

export default function ResumeRequestForm({
  formTitle,
  confirmationTitle,
  confirmationBody,
}: {
  formTitle: string;
  confirmationTitle: string;
  confirmationBody: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  // `website` is a honeypot: rendered off-screen, never filled by humans.
  const [values, setValues] = useState({
    name: "",
    email: "",
    company: "",
    roleDetails: "",
    website: "",
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await apiPost<{ ok: true; firstName: string }>("/public/resume-request", values);
      setFirstName(res.firstName);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setPending(false);
    }
  };

  if (firstName !== null) {
    return (
      <div className="flex flex-col border border-navy-rule bg-navy-panel p-10 lg:px-14 lg:py-14">
        <div className="flex flex-col items-center py-[60px] text-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-gold font-display text-[34px] text-gold">
            ✓
          </div>
          <span className="mt-[30px] font-display text-[40px] font-medium">{confirmationTitle}</span>
          <p className="mt-[18px] max-w-[460px] text-[18px] leading-[1.7] text-dark-muted" style={{ textWrap: "pretty" }}>
            Thank you, {firstName}. {confirmationBody}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col border border-navy-rule bg-navy-panel p-8 md:p-14 md:pb-[52px]">
      <span className="font-display text-[36px] font-medium">{formTitle}</span>
      <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-[26px]">
        <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
          <label>
            Website
            <input
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={values.website}
              onChange={(e) => setValues({ ...values, website: e.target.value })}
            />
          </label>
        </div>
        <Field label="FULL NAME *">
          <input
            name="name"
            required
            placeholder="Jane Smith"
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="EMAIL *">
          <input
            name="email"
            type="email"
            required
            placeholder="jane@company.com"
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="COMPANY / ORGANIZATION">
          <input
            name="company"
            placeholder="Company name"
            value={values.company}
            onChange={(e) => setValues({ ...values, company: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="ROLE / OPPORTUNITY *">
          <textarea
            name="roleDetails"
            required
            rows={4}
            placeholder="Tell me about the role or engagement — a link to the posting works too."
            value={values.roleDetails}
            onChange={(e) => setValues({ ...values, roleDetails: e.target.value })}
            className={`${inputClass} resize-y`}
          />
        </Field>
        {error ? <span className="text-[14px] text-form-error">{error}</span> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-1.5 bg-gold py-5 text-center text-[15px] font-semibold tracking-[0.14em] text-on-gold transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "SUBMITTING…" : "SUBMIT REQUEST"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2.5">
      <span className="text-[12px] font-semibold tracking-[0.2em] text-dark-muted">{label}</span>
      {children}
    </label>
  );
}
