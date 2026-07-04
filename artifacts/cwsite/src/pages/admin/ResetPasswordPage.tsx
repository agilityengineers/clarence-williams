import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, apiPost, assetUrl } from "@/lib/api";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Consume a reset token from the emailed link (?token=…) and set a new
 * password. On success the backend revokes all existing sessions, so we send
 * the admin back to the sign-in page to log in with the new password.
 */
export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.title = "Set New Password — Clarence Williams";
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    try {
      await apiPost("/auth/reset-password", { token, password });
      // The reset revoked every session, including any this browser held.
      await queryClient.invalidateQueries({ queryKey: ["admin", "session"] });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "This reset link is invalid or has expired.",
      );
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
          Set a new <span className="italic text-gold">password</span>
        </h1>

        {done ? (
          <>
            <p className="mt-6 border border-gold/40 bg-gold/10 p-4 text-sm text-dark-ivory">
              Your password has been updated and all existing sessions were signed out.
              You can now sign in with your new password.
            </p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-8 w-full bg-gold px-6 py-4 font-sans text-[15px] font-semibold uppercase tracking-[0.14em] text-on-gold transition-opacity hover:opacity-90"
            >
              Go to Sign In
            </button>
          </>
        ) : token === null ? (
          <>
            <p className="mt-6 border border-form-error/40 bg-form-error/10 p-4 text-sm text-dark-ivory">
              This reset link is missing its token. Request a new link and try again.
            </p>
            <p className="mt-6">
              <Link
                href="/forgot-password"
                className="font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-dark-muted transition-colors hover:text-gold"
              >
                Request a new link
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="mt-6 font-sans text-[15px] leading-relaxed text-dark-muted">
              Choose a new password of at least {MIN_PASSWORD_LENGTH} characters.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-7">
              <div>
                <label
                  htmlFor="password"
                  className="block font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-dark-muted"
                >
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="mt-3 w-full border border-navy-rule bg-navy px-4 py-3.5 font-sans text-[16px] text-dark-ivory outline-none transition-colors focus:border-gold"
                />
              </div>
              <div>
                <label
                  htmlFor="confirm"
                  className="block font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-dark-muted"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
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
                {pending ? "Please wait…" : "Set New Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
