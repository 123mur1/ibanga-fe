"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { TruckForm } from "@/features/owner-fleet/truck-form";
import { useIbanga } from "@/lib/store";

export default function NewTruckPage() {
  const { addTruck } = useIbanga();
  const router = useRouter();

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        <div>
          <Link href="/dashboard/owner/trucks" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 4-8 8 8 8" />
            </svg>
            My trucks
          </Link>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-navy">Add a vehicle</h1>
          <p className="mt-1.5 text-sm text-muted">Set your price per kilometre and the places you deliver to. Once verified, importers can book it on any free dates.</p>
        </div>

        <TruckForm
          submitLabel="Save vehicle"
          footerNote="The vehicle appears in the marketplace once its documents are approved."
          onSubmit={async (values) => {
            const error = await addTruck(values);
            if (!error) router.push("/dashboard/owner/trucks");
            return error;
          }}
        />
      </DashboardShell>
    </RequireAuth>
  );
}
