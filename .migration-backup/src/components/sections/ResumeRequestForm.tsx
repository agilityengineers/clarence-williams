"use client";

import { useActionState } from "react";
import { submitResumeRequest, type ResumeFormState } from "@/app/actions/leads";

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
  const [state, formAction, pending] = useActionState<ResumeFormState, FormData>(
    submitResumeRequest,
    null,
  );

  if (state?.ok) {
    return (
      <div className="flex flex-col border border-navy-rule bg-navy-panel p-10 lg:px-14 lg:py-14">
        <div className="flex flex-col items-center py-[60px] text-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-gold font-display text-[34px] text-gold">
            ✓
          </div>
          <span className="mt-[30px] font-display text-[40px] font-medium">{confirmationTitle}</span>
          <p className="mt-[18px] max-w-[460px] text-[18px] leading-[1.7] text-dark-muted" style={{ textWrap: "pretty" }}>
            Thank you, {state.firstName}. {confirmationBody}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col border border-navy-rule bg-navy-panel p-8 md:p-14 md:pb-[52px]">
      <span className="font-display text-[36px] font-medium">{formTitle}</span>
      <form action={formAction} className="mt-10 flex flex-col gap-[26px]">
        <Field label="FULL NAME *">
          <input name="name" required placeholder="Jane Smith" defaultValue={state?.values?.name} className={inputClass} />
        </Field>
        <Field label="EMAIL *">
          <input name="email" type="email" required placeholder="jane@company.com" defaultValue={state?.values?.email} className={inputClass} />
        </Field>
        <Field label="COMPANY / ORGANIZATION">
          <input name="company" placeholder="Company name" defaultValue={state?.values?.company} className={inputClass} />
        </Field>
        <Field label="ROLE / OPPORTUNITY *">
          <textarea
            name="roleDetails"
            required
            rows={4}
            placeholder="Tell me about the role or engagement — a link to the posting works too."
            defaultValue={state?.values?.roleDetails}
            className={`${inputClass} resize-y`}
          />
        </Field>
        {state?.error ? <span className="text-[14px] text-form-error">{state.error}</span> : null}
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
