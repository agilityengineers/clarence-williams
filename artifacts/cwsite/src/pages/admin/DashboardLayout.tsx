import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { apiPost, assetUrl } from "@/lib/api";

/** Everything under this group requires the admin session. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const logout = async () => {
    await apiPost("/auth/logout");
    await queryClient.invalidateQueries({ queryKey: ["admin", "session"] });
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-ivory text-ink">
      <header className="border-b border-navy-rule bg-navy">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 lg:px-12">
          <Link href="/" className="flex items-center gap-3">
            <img
              src={assetUrl("/assets/logo-gold.png")}
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
            <a
              href={assetUrl("/")}
              className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-dark-muted transition-colors hover:text-dark-ivory"
            >
              View Site
            </a>
            <form onSubmit={(e) => { e.preventDefault(); void logout(); }}>
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
      <nav className="border-b border-rule-light bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap gap-x-7 gap-y-2 px-6 py-3 lg:px-12">
          {[
            ["Dashboard", "/"],
            ["Pages", "/pages"],
            ["Sections", "/sections"],
            ["Assessments", "/assessments"],
            ["Books", "/books"],
            ["Media", "/media"],
            ["Leads", "/leads"],
            ["Settings", "/settings"],
            ["API Keys", "/api-keys"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-secondary transition-colors hover:text-bronze"
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-10 lg:px-12">{children}</main>
    </div>
  );
}
