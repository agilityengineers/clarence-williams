import SiteFooter from "@/components/SiteFooter";

// All public pages render from the database and must reflect admin edits
// immediately, so the whole site group is dynamic (no build-time prerender).
export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
