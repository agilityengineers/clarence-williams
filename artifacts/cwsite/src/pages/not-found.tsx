import { Link } from "wouter";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-navy px-6 py-32 text-center">
        <span className="eyebrow-dash font-sans text-[13px] font-semibold uppercase tracking-[0.24em] text-gold">
          404
        </span>
        <h1 className="font-display text-[36px] font-medium leading-tight text-dark-ivory sm:text-[44px]">
          This page could not be found.
        </h1>
        <Link
          href="/"
          className="mt-4 bg-gold px-8 py-4 font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-on-gold transition-opacity hover:opacity-90"
        >
          Back to home
        </Link>
      </main>
      <SiteFooter variant="slim" />
    </>
  );
}
