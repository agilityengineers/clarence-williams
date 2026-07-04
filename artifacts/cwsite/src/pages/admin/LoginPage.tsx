import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, apiPost, assetUrl } from "@/lib/api";
import { useSession } from "./session";
import AuthForm, { type AuthFormState } from "./AuthForm";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const session = useSession();

  useEffect(() => {
    document.title = "Admin Sign In — Clarence Williams";
  }, []);

  useEffect(() => {
    if (!session.data) return;
    if (session.data.session) navigate("/");
  }, [session.data, navigate]);

  const onSubmit = async (formData: FormData): Promise<AuthFormState> => {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    if (!email || !password) return { error: "Email and password are required.", email };
    try {
      await apiPost("/auth/login", { email, password });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Invalid email or password.";
      return { error: message, email };
    }
    await queryClient.invalidateQueries({ queryKey: ["admin", "session"] });
    navigate("/");
    return null;
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
          Admin <span className="italic text-gold">sign in</span>
        </h1>
        {session.data && !session.data.hasAdmin && (
          <p className="mt-6 border border-gold/40 bg-gold/10 p-4 text-sm text-dark-ivory">
            No admin account is configured. Set the <code>ADMIN_EMAIL</code> and{" "}
            <code>ADMIN_PASSWORD</code> secrets (in development and in the deployment), then
            restart or redeploy to sign in.
          </p>
        )}
        <AuthForm
          onSubmit={onSubmit}
          submitLabel="Sign In"
          fields={[
            { name: "email", label: "Email", type: "email", autoComplete: "username" },
            {
              name: "password",
              label: "Password",
              type: "password",
              autoComplete: "current-password",
            },
          ]}
        />
        <p className="mt-6 text-center">
          <Link
            href="/forgot-password"
            className="font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-dark-muted transition-colors hover:text-gold"
          >
            Forgot password?
          </Link>
        </p>
      </div>
    </main>
  );
}
