"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Top-level error boundary: shows a recoverable message instead of a blank screen. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled application error", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-bad">Something went wrong</p>
      <h1 className="mt-2 font-display text-3xl text-navy">We hit an unexpected problem</h1>
      <p className="mt-3 text-muted">Your data is safe. Try again, or return to the home page.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
          Try again
        </button>
        <Link href="/" className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:border-brand/40">
          Home
        </Link>
      </div>
    </main>
  );
}
