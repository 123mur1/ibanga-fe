"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { TruckBadge } from "@/components/status-badge";
import { TruckThumb } from "@/components/photos";
import { EmptyState, GhostButton } from "@/components/ui";
import { useIbanga } from "@/lib/store";

export default function OwnerTrucksPage() {
  const { currentUser, trucks, trucksLoading, refreshTrucks, deleteTruck, setAvailability } =
    useIbanga();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) refreshTrucks({ mine: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  async function onDelete(id: string) {
    setError(null);
    const err = await deleteTruck(id);
    if (err) setError(err);
  }

  async function onToggleAvailability(id: string, status: "AVAILABLE" | "UNAVAILABLE") {
    setError(null);
    const err = await setAvailability(id, status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE");
    if (err) setError(err);
  }

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-navy">My trucks</h1>
            <p className="mt-1 text-muted">
              Unavailable trucks do not show in importer search.
            </p>
          </div>
          <Link
            href="/dashboard/owner/trucks/new"
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
          >
            Add truck
          </Link>
        </div>
        {error ? <p className="mt-4 text-sm text-bad">{error}</p> : null}
        <div className="mt-6 space-y-3">
          {trucksLoading ? (
            <p className="text-muted">Loading…</p>
          ) : trucks.length ? (
            trucks.map((truck) => (
              <div
                key={truck.id}
                className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-5 sm:flex-row"
              >
                <TruckThumb
                  photos={truck.photos}
                  alt={truck.plateNumber}
                  className="aspect-4/3 sm:w-48 sm:shrink-0"
                />
                <div className="flex flex-1 flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-xl text-navy">
                        {truck.plateNumber}
                      </p>
                      <p className="text-sm text-muted">
                        {truck.truckType} · {truck.capacity} tons · {truck.currentLocation}
                      </p>
                      <p className="mt-1 text-sm">{truck.preferredRoute}</p>
                    </div>
                    <TruckBadge status={truck.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/dashboard/owner/trucks/${truck.id}/edit`}
                      className="rounded-xl border border-line px-3 py-2 text-sm font-semibold"
                    >
                      Edit
                    </Link>
                    <GhostButton
                      type="button"
                      onClick={() => onToggleAvailability(truck.id, truck.status)}
                    >
                      Mark{" "}
                      {truck.status === "AVAILABLE" ? "unavailable" : "available"}
                    </GhostButton>
                    <GhostButton
                      type="button"
                      onClick={() => onDelete(truck.id)}
                    >
                      Delete
                    </GhostButton>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No trucks listed"
              text="Add a truck with plate, type, capacity, location and route."
            />
          )}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
