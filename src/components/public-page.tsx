import Link from "next/link";
import { PublicNavbar } from "./public-navbar";

export function PublicFooter() {
  return (
    <footer className="mt-12 border-t border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} iBanga. Freight moves forward.</span>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 font-semibold">
          <Link href="/about" className="hover:text-brand">About</Link>
          <Link href="/how-it-works" className="hover:text-brand">How it works</Link>
          <Link href="/help" className="hover:text-brand">Help centre</Link>
          <Link href="/contact" className="hover:text-brand">Contact</Link>
          <Link href="/terms" className="hover:text-brand">Terms</Link>
          <Link href="/privacy" className="hover:text-brand">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}

/** Shared frame for public information pages: navbar, page heading and footer. */
export function PublicPage({
  eyebrow,
  title,
  intro,
  width = "max-w-4xl",
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  width?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <main className={`mx-auto px-4 py-12 sm:px-6 ${width}`}>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-navy sm:text-4xl">{title}</h1>
        {intro ? <p className="mt-3 max-w-2xl text-base leading-7 text-muted">{intro}</p> : null}
        <div className="mt-8">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}
