import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">404</p>
      <h1 className="mt-2 font-display text-3xl text-navy">We could not find that page</h1>
      <p className="mt-3 text-muted">The link may be old, or the record may have been removed.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
          Go to the home page
        </Link>
        <Link href="/login" className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:border-brand/40">
          Log in
        </Link>
      </div>
    </main>
  );
}
