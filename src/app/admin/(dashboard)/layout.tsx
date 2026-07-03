import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, hasAdminUser } from "@/lib/auth";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

/** Everything under this group requires the admin session. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasAdminUser())) redirect("/admin/setup");
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col bg-ivory text-ink">
      <header className="border-b border-navy-rule bg-navy">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 lg:px-12">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/assets/logo-gold.png"
              alt="CW monogram"
              width={30}
              height={30}
              className="h-[30px] w-[30px] object-contain"
            />
            <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.2em] text-dark-ivory">
              Clarence Williams — Admin
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-dark-muted transition-colors hover:text-dark-ivory"
            >
              View Site
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="border border-navy-rule px-4 py-2 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-dark-muted transition-colors hover:border-gold hover:text-gold"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-10 lg:px-12">{children}</main>
    </div>
  );
}
