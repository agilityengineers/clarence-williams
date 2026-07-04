import { useEffect, useState } from "react";
import { Link } from "wouter";
import { apiPost, assetUrl } from "@/lib/api";

/**
 * Request a reset link. The response is intentionally generic — it never
 * reveals whether the submitted address matches the admin account — so on any
 * non-error outcome we show the same confirmation.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Reset Password — Clarence Williams";
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await apiPost("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      // Generic — do not surface anything that hints at account existence.
      setError("Something went wrong. Please try again in a few minutes.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-6">
      <div className="w-full max-w-[460px] border border-navy-rule bg-navy-panel p-10 md:p-14">
        <img
          src={assetUrl("/assets/logo-gold.png")}
          alt="CW monogram"
          width={44}
          height={44}
          className="h-11 w-11 object-contain"
        />
        <h1 className="mt-8 font-display text-[40px] leading-tight text-dark-ivory">
          Forgot <span className="italic text-gold">password</span>
        </h1>

        {sent ? (
          <>
            <p className="mt-6 border border-gold/40 bg-gold/10 p-4 text-sm text-dark-ivory">
              If that email matches the admin account, a reset link is on its way. The
              link expires shortly and can be used once.
            </p>
            <p className="mt-6">
              <Link
                href="/login"
                className="font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-dark-muted transition-colors hover:text-gold"
              >
                ← Back to sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="mt-6 font-sans text-[15px] leading-relaxed text-dark-muted">
              Enter the admin email address and we'll send a link to set a new password.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-7">
              <div>
                <label
                  htmlFor="email"
                  className="block font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-dark-muted"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  className="mt-3 w-full border border-navy-rule bg-navy px-4 py-3.5 font-sans text-[16px] text-dark-ivory outline-none transition-colors focus:border-gold"
                />
              </div>
              {error ? (
                <p className="font-sans text-[14px] text-form-error">{error}</p>
              ) : null}
              <button
                type="submit"
                disabled={pending}
                className="w-full bg-gold px-6 py-4 font-sans text-[15px] font-semibold uppercase tracking-[0.14em] text-on-gold transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "Please wait…" : "Send Reset Link"}
              </button>
            </form>
            <p className="mt-6 text-center">
              <Link
                href="/login"
                className="font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-dark-muted transition-colors hover:text-gold"
              >
                ← Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
