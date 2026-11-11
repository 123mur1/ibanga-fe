"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { WorkspaceLoading } from "@/components/loading";
import { RequireAuth } from "@/components/require-auth";
import { TruckForm } from "@/features/owner-fleet/truck-form";
import { useIbanga } from "@/lib/store";
import type { Truck } from "@/lib/types";

export default function EditTruckPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser, fetchTruck, updateTruck } = useIbanga();
  const [truck, setTruck] = useState<Truck | null | undefined>(undefined);

  useEffect(() => {
    fetchTruck(id)
      .then((loaded) => setTruck(loaded.ownerId === currentUser?.id ? loaded : null))
      .catch(() => setTruck(null));
  }, [id, currentUser?.id, fetchTruck]);

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
          <h1 className="mt-2 font-display text-3xl tracking-tight text-navy">Edit vehicle</h1>
          <p className="mt-1.5 text-sm text-muted">Keep the location, rate and destinations current so importers know what to expect.</p>
        </div>

        {truck === undefined ? (
          <WorkspaceLoading
            label="Preparing your truck"
            detail="Loading your saved vehicle details."
            compact
          />
        ) : !truck ? (
          <p className="mt-6 rounded-2xl border border-line bg-card px-5 py-8 text-center text-muted shadow-soft">Vehicle not found.</p>
        ) : (
          <TruckForm
            initial={truck}
            submitLabel="Update vehicle"
            footerNote="Changes apply to the marketplace immediately. Existing bookings keep their price."
            onSubmit={async (values) => {
              const error = await updateTruck(id, values);
              if (!error) router.push("/dashboard/owner/trucks");
              return error;
            }}
          />
        )}
      </DashboardShell>
    </RequireAuth>
  );
}
