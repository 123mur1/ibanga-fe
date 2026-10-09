"use client";

import Link from "next/link";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { TruckBadge } from "@/components/status-badge";
import { DataTable, PageHeader, StatCard } from "@/components/ui";
import { useIbanga } from "@/lib/store";

export default function OwnerTrucksPage() {
  const { trucks, trucksLoading, deleteTruck, setAvailability } =
    useIbanga();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Fleet vehicles" value={trucks.length} hint="In your account" />
          <StatCard label="Available" value={availableCount} hint="Ready to book" accent="good" />
          <StatCard label="Unavailable" value={trucks.length - availableCount} hint="On a trip or paused" accent="warn" />
        </div>
        <div className="mt-5">
          {trucksLoading ? <p className="text-muted">Loading your fleet…</p> : (
            <DataTable
              columns={[{ label: "Vehicle" }, { label: "Capacity" }, { label: "Location" }, { label: "Route" }, { label: "Price" }, { label: "Availability" }, { label: "Actions" }]}
              filterLabel="All availability"
              rows={trucks.map((truck) => ({
                id: truck.id,
                searchText: `${truck.plateNumber} ${truck.truckType} ${truck.currentLocation} ${truck.preferredRoute}`,
                filterValue: truck.status,
                exportValues: [truck.plateNumber, truck.truckType, `${truck.capacity} tons`, truck.currentLocation, truck.preferredRoute, truck.priceRwf == null ? "" : `RWF ${truck.priceRwf.toLocaleString()}`, truck.status],
                cells: [
                  <span key={`${truck.id}-vehicle`}><strong className="block">{truck.plateNumber}</strong><span className="text-xs text-muted">{truck.truckType}</span></span>,
                  `${truck.capacity} tons`,
                  truck.currentLocation,
                  truck.preferredRoute,
                  truck.priceRwf == null ? "Price not set" : `RWF ${truck.priceRwf.toLocaleString()}`,
                  <span key={`${truck.id}-status`}><TruckBadge status={truck.status} /></span>,
                  <div key={`${truck.id}-actions`} className="flex flex-wrap gap-1.5">
                    <Link href={`/dashboard/owner/trucks/${truck.id}/edit`} className="rounded-lg border border-line px-2 py-1 text-xs font-semibold text-navy">Edit</Link>
                    <button type="button" disabled={busyId === truck.id} onClick={() => void onToggleAvailability(truck.id, truck.status)} className="rounded-lg border border-line px-2 py-1 text-xs font-semibold text-navy disabled:opacity-50">{truck.status === "AVAILABLE" ? "Pause" : "Activate"}</button>
                    <button type="button" onClick={() => void onDelete(truck.id)} className="rounded-lg border border-bad/20 px-2 py-1 text-xs font-semibold text-bad">Delete</button>
                  </div>,
                ],
              }))}
            />
          )}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}