"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Error boundary for every dashboard page, so one broken screen never takes down the whole app. */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard error", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-bad">This page hit a problem</p>
      <h1 className="mt-2 font-display text-2xl text-navy">We could not show this screen</h1>
      <p className="mt-3 text-muted">The rest of your workspace is fine. Try again or go back to your overview.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
          Try again
        </button>
        <Link href="/dashboard" className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:border-brand/40">
          My overview
        </Link>
      </div>
    </main>
  );
}
