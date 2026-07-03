import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { hasAdminUser } from "@/lib/auth";
import { setupAction } from "../actions";
import AuthForm from "../AuthForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "First-Run Setup — Clarence Williams",
  robots: { index: false, follow: false },
};

/** One-time creation of the single admin account. Disabled once it exists. */
export default async function AdminSetupPage() {
  if (await hasAdminUser()) redirect("/admin/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-6">
      <div className="w-full max-w-[460px] border border-navy-rule bg-navy-panel p-10 md:p-14">
        <Image
          src="/assets/logo-gold.png"
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
          action={setupAction}
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
