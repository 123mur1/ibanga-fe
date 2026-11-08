"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { TruckBrowser } from "@/components/truck-browser";
import { PageHeader } from "@/components/ui";

function Browser() {
  const search = useSearchParams().get("q") ?? "";
  // Keyed on the query so a new search from the header starts from it.
  return <TruckBrowser key={search} initialSearch={search} stickyClass="lg:sticky lg:top-0" />;
}

/** Truck search inside the importer dashboard, so finding a truck never leaves the app. */
export default function ImporterFindTrucksPage() {
  return (
    <RequireAuth role="IMPORTER">
      <DashboardShell role="IMPORTER">
        <PageHeader
          title="Find a truck"
          subtitle="Search verified trucks by location, type, capacity and price, then open one to send a booking request."
        />
        <div className="mt-6">
          <Suspense fallback={null}>
            <Browser />
          </Suspense>
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
