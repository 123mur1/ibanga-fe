"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PublicNavbar } from "@/components/public-navbar";
import { PublicFooter } from "@/components/public-page";
import { TruckBrowser } from "@/components/truck-browser";

function Browser() {
  const search = useSearchParams().get("q") ?? "";
  // Keyed on the query so a new search from the header starts from it.
  return <TruckBrowser key={search} initialSearch={search} />;
}

/** The public marketplace: every verified, available truck with search and filters. */
export default function TrucksPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNavbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Ready to move</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-navy sm:text-4xl">Find a truck</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Search verified trucks by location, type, capacity and price, then open one to send a booking request.
          </p>
        </header>
        <Suspense fallback={null}>
          <Browser />
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  );
}
