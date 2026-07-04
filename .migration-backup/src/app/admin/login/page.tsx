import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession, hasAdminUser } from "@/lib/auth";
import { loginAction } from "../actions";
import AuthForm from "../AuthForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Sign In — Clarence Williams",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await getSession()) redirect("/admin");
  if (!(await hasAdminUser())) redirect("/admin/setup");

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
          Admin <span className="italic text-gold">sign in</span>
        </h1>
        <AuthForm
          action={loginAction}
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
      </div>
    </main>
  );
}
