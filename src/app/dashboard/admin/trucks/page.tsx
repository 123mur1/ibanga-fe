"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { TruckBadge } from "@/components/status-badge";
import { DataTable, PageHeader, StatCard } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/types";
import { useState } from "react";

export default function AdminTrucksPage() {
  const { trucks, bookings, setAvailability, deleteTruck } = useIbanga();
  const [busyTruckId, setBusyTruckId] = useState<string | null>(null);

  const available = trucks.filter((t) => t.status === "AVAILABLE").length;
  const heldTruckIds = new Set(
    bookings
      .filter((booking) => ACTIVE_BOOKING_STATUSES.includes(booking.status))
      .map((booking) => booking.truckId),
  );
  const truckIdsWithHistory = new Set(bookings.map((booking) => booking.truckId));

  async function toggleAvailability(id: string, status: "AVAILABLE" | "UNAVAILABLE") {
    setBusyTruckId(id);
    const error = await setAvailability(id, status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE");
    setBusyTruckId(null);
    if (error) window.alert(error);
  }

  async function removeTruck(id: string, plateNumber: string) {
    if (!window.confirm(`Remove truck ${plateNumber}? This cannot be undone.`)) return;
    setBusyTruckId(id);
    const error = await deleteTruck(id);
    setBusyTruckId(null);
    if (error) window.alert(error);
  }

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <PageHeader
          eyebrow="Marketplace"
          title="Trucks"
          subtitle={`${available} of ${trucks.length} trucks currently available to book.`}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
              <circle cx="7.5" cy="17.5" r="1.8" />
              <circle cx="17.5" cy="17.5" r="1.8" />
            </svg>
          }
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Fleet size" value={trucks.length} hint="Registered vehicles" />
          <StatCard label="Available" value={available} hint="Ready for bookings" accent="good" />
          <StatCard label="Owners" value={new Set(trucks.map((truck) => truck.ownerId)).size} hint="Active fleet partners" accent="accent" />
        </div>
        <div className="mt-5">
          <DataTable
            columns={[{ label: "Vehicle" }, { label: "Owner" }, { label: "Capacity" }, { label: "Location" }, { label: "Route" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
            filterLabel="All availability"
            rows={trucks.map((truck) => ({
              id: truck.id,
              searchText: `${truck.plateNumber} ${truck.truckType} ${truck.owner?.name ?? ""} ${truck.currentLocation} ${truck.preferredRoute}`,
              filterValue: truck.status,
              exportValues: [truck.plateNumber, truck.owner?.name ?? "", `${truck.capacity} tons`, truck.currentLocation, truck.preferredRoute, truck.status, ""],
              cells: [
                <span key={`${truck.id}-vehicle`}><strong className="block">{truck.plateNumber}</strong><span className="text-xs text-muted">{truck.truckType}</span></span>,
                truck.owner?.name ?? "—",
                `${truck.capacity} tons`,
                truck.currentLocation,
                truck.preferredRoute,
                <span key={`${truck.id}-status`}><TruckBadge status={truck.status} /></span>,
                <div key={`${truck.id}-actions`} className="flex min-w-44 justify-end gap-2">
                  <button
                    type="button"
                    disabled={busyTruckId === truck.id || (truck.status === "UNAVAILABLE" && heldTruckIds.has(truck.id))}
                    onClick={() => void toggleAvailability(truck.id, truck.status)}
                    className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-navy hover:bg-background disabled:opacity-60"
                  >
                    {truck.status === "AVAILABLE" ? "Disable" : heldTruckIds.has(truck.id) ? "On booking" : "Enable"}
                  </button>
                  <button
                    type="button"
                    disabled={busyTruckId === truck.id || truckIdsWithHistory.has(truck.id)}
                    onClick={() => void removeTruck(truck.id, truck.plateNumber)}
                    className="rounded-lg border border-bad/20 px-2.5 py-1.5 text-xs font-semibold text-bad hover:bg-bad-soft disabled:opacity-60"
                  >
                    {truckIdsWithHistory.has(truck.id) ? "Has bookings" : "Remove"}
                  </button>
                </div>,
              ],
            }))}
          />
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}