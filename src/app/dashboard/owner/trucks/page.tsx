"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { TruckBadge } from "@/components/status-badge";
import { EmptyState, PageHeader } from "@/components/ui";
import { TruckThumb } from "@/components/photos";
import { useIbanga } from "@/lib/store";

export default function OwnerTrucksPage() {
  const { currentUser, trucks, trucksLoading, refreshTrucks, deleteTruck, setAvailability } =
    useIbanga();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
    setBusyId(id);
    const err = await setAvailability(id, status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE");
    setBusyId(null);
    if (err) setError(err);
  }

  const availableCount = trucks.filter((t) => t.status === "AVAILABLE").length;

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        <PageHeader
          eyebrow="Fleet"
          title="My trucks"
          subtitle={`${availableCount} of ${trucks.length} currently available to importers.`}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
              <circle cx="7.5" cy="17.5" r="1.8" />
              <circle cx="17.5" cy="17.5" r="1.8" />
            </svg>
          }
          actions={
            <Link
              href="/dashboard/owner/trucks/new"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-card"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add truck
            </Link>
          }
        />

        {error ? (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-bad/20 bg-bad-soft px-3.5 py-2.5 text-sm text-bad">
            {error}
          </p>
        ) : null}

        <div className="mt-6 space-y-4">
          {trucksLoading ? (
            <p className="text-muted">Loading your fleet…</p>
          ) : trucks.length ? (
            trucks.map((truck) => (
              <div
                key={truck.id}
                className="group overflow-hidden rounded-2xl border border-line bg-card shadow-soft transition hover:border-brand/25 hover:shadow-card"
              >
                <div className="flex flex-col gap-4 p-5 sm:flex-row">
                  <TruckThumb
                    photos={truck.photos}
                    alt={truck.plateNumber}
                    className="aspect-4/3 sm:w-44 sm:shrink-0"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-xl tracking-tight text-navy">
                          {truck.plateNumber}
                        </p>
                        <p className="text-sm text-muted">
                          {truck.truckType} · {truck.capacity} tons ·{" "}
                          {truck.currentLocation}
                        </p>
                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-navy/80">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="6" cy="19" r="2.5" />
                            <circle cx="18" cy="5" r="2.5" />
                            <path d="M8.5 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
                          </svg>
                          {truck.preferredRoute}
                        </p>
                      </div>
                      <TruckBadge status={truck.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/owner/trucks/${truck.id}/edit`}
                        className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-navy shadow-soft transition hover:-translate-y-0.5 hover:border-navy/20"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={busyId === truck.id}
                        onClick={() => onToggleAvailability(truck.id, truck.status)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-navy shadow-soft transition hover:-translate-y-0.5 hover:border-navy/20 disabled:opacity-60"
                      >
                        {busyId === truck.id ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted border-t-transparent" />
                        ) : truck.status === "AVAILABLE" ? (
                          <span className="h-2 w-2 rounded-full bg-warn" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-good" />
                        )}
                        {busyId === truck.id
                          ? "Updating…"
                          : truck.status === "AVAILABLE"
                          ? "Make unavailable"
                          : "Make available"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(truck.id)}
                        className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-bad shadow-soft transition hover:-translate-y-0.5 hover:border-bad/30 hover:bg-bad-soft"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No trucks listed"
              text="Add a truck with plate, type, capacity, location and route, then it appears in importer search."
              action={
                <Link
                  href="/dashboard/owner/trucks/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-card"
                >
                  Add your first truck
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              }
            />
          )}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}