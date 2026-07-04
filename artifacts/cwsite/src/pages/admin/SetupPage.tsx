import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, apiPost, assetUrl } from "@/lib/api";
import { useSession } from "./session";
import AuthForm, { type AuthFormState } from "./AuthForm";

/** One-time creation of the single admin account. Disabled once it exists. */
export default function SetupPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const session = useSession();

  useEffect(() => {
    document.title = "First-Run Setup — Clarence Williams";
  }, []);

  useEffect(() => {
    if (session.data?.hasAdmin) navigate("/login");
  }, [session.data, navigate]);

  const onSubmit = async (formData: FormData): Promise<AuthFormState> => {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Enter a valid email address.", email };
    }
    if (password.length < 10) {
      return { error: "Password must be at least 10 characters.", email };
    }
    if (password !== confirm) return { error: "Passwords do not match.", email };
    try {
      await apiPost("/auth/setup", { email, password, confirm });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Setup failed.";
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
          Create the <span className="italic text-gold">admin account</span>
        </h1>
        <p className="mt-4 font-sans text-[15px] leading-relaxed text-dark-muted">
          This runs once. The account you create here is the site&rsquo;s only
          administrator login.
        </p>
        <AuthForm
          onSubmit={onSubmit}
          submitLabel="Create Account"
          fields={[
            { name: "email", label: "Email", type: "email", autoComplete: "username" },
            {
              name: "password",
              label: "Password (min. 10 characters)",
              type: "password",
              autoComplete: "new-password",
            },
            {
              name: "confirm",
              label: "Confirm Password",
              type: "password",
              autoComplete: "new-password",
            },
          ]}
        />
      </div>
    </main>
  );
}
