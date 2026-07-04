import { useState } from "react";

export type AuthFormState = { error: string; email: string } | null;

type Field = {
  name: string;
  label: string;
  type: "email" | "password";
  autoComplete?: string;
};

export default function AuthForm({
  onSubmit,
  fields,
  submitLabel,
}: {
  onSubmit: (formData: FormData) => Promise<AuthFormState>;
  fields: Field[];
  submitLabel: string;
}) {
  const [state, setState] = useState<AuthFormState>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await onSubmit(formData);
    setPending(false);
    setState(result);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-7">
      {fields.map((f) => (
        <div key={f.name}>
          <label
            htmlFor={f.name}
            className="block font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-dark-muted"
          >
            {f.label}
          </label>
          <input
            id={f.name}
            name={f.name}
            type={f.type}
            required
            defaultValue={f.type === "email" ? (state?.email ?? "") : undefined}
            autoComplete={f.autoComplete}
            className="mt-3 w-full border border-navy-rule bg-navy px-4 py-3.5 font-sans text-[16px] text-dark-ivory outline-none transition-colors focus:border-gold"
          />
        </div>
      ))}
      {state?.error ? (
        <p className="font-sans text-[14px] text-form-error">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-gold px-6 py-4 font-sans text-[15px] font-semibold uppercase tracking-[0.14em] text-on-gold transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
