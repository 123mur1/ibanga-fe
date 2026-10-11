"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { TruckBadge } from "@/components/status-badge";
import { DataTable, PageHeader, StatCard } from "@/components/ui";
import { useIbanga } from "@/lib/store";

export default function AdminTrucksPage() {
  const { trucks } = useIbanga();

  const available = trucks.filter((t) => t.status === "AVAILABLE").length;

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
            columns={[{ label: "Vehicle" }, { label: "Owner" }, { label: "Capacity" }, { label: "Location" }, { label: "Route" }, { label: "Status" }]}
            filterLabel="All availability"
            rows={trucks.map((truck) => ({
              id: truck.id,
              searchText: `${truck.plateNumber} ${truck.truckType} ${truck.owner?.name ?? ""} ${truck.currentLocation} ${truck.preferredRoute}`,
              filterValue: truck.status,
              exportValues: [truck.plateNumber, truck.owner?.name ?? "", `${truck.capacity} tons`, truck.currentLocation, truck.preferredRoute, truck.status],
              cells: [
                <span key={`${truck.id}-vehicle`}><strong className="block">{truck.plateNumber}</strong><span className="text-xs text-muted">{truck.truckType}</span></span>,
                truck.owner?.name ?? "—",
                `${truck.capacity} tons`,
                truck.currentLocation,
                truck.preferredRoute,
                <span key={`${truck.id}-status`}><TruckBadge status={truck.status} /></span>,
              ],
            }))}
          />
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}