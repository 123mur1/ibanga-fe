"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { TruckBadge } from "@/components/status-badge";
import { TruckThumb } from "@/components/photos";
import { DataTable, PageHeader, StatCard, ViewLink } from "@/components/ui";
import { formatRwf } from "@/lib/payments";
import { useIbanga } from "@/lib/store";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/types";

const truckIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
    <circle cx="7.5" cy="17.5" r="1.8" />
    <circle cx="17.5" cy="17.5" r="1.8" />
  </svg>
);

export default function OwnerTrucksPage() {
  const { currentUser, trucks, bookings, trucksLoading } = useIbanga();
  const mine = trucks.filter((truck) => truck.ownerId === currentUser?.id);
  const available = mine.filter((truck) => truck.status === "AVAILABLE").length;
  const onTrip = new Set(
    bookings.filter((booking) => ACTIVE_BOOKING_STATUSES.includes(booking.status)).map((booking) => booking.truckId),
  );
  const totalCapacity = mine.reduce((sum, truck) => sum + truck.capacity, 0);

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        <PageHeader
          eyebrow="Fleet"
          title="My trucks"
          subtitle={`${available} of ${mine.length} currently available to importers.`}
          icon={truckIcon}
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Fleet vehicles" value={mine.length} hint="In your account" icon={truckIcon} href="/dashboard/owner/trucks" />
          <StatCard label="Available" value={available} hint="Ready to book" accent="good" href="/dashboard/owner/trucks?status=AVAILABLE" />
          <StatCard label="On a booking" value={mine.filter((truck) => onTrip.has(truck.id)).length} hint="Held by an importer" accent="accent" href="/dashboard/owner/bookings?status=ACCEPTED,IN_PROGRESS,DELIVERED" />
          <StatCard label="Total capacity" value={`${totalCapacity} t`} hint="Across the fleet" accent="warn" href="/dashboard/owner/trucks" />
        </div>

        <div className="mt-5">
          {trucksLoading ? (
            <p className="text-muted">Loading your fleet…</p>
          ) : (
            <DataTable
              columns={[
                { label: "Vehicle" },
                { label: "Capacity" },
                { label: "Location" },
                { label: "Route" },
                { label: "Price" },
                { label: "Availability" },
                { label: "Details", className: "text-right" },
              ]}
              emptyMessage="You have not added any trucks yet."
              filterLabel="All availability"
              exportName="ibanga-my-trucks"
              rows={mine.map((truck) => ({
                id: truck.id,
                searchText: `${truck.plateNumber} ${truck.truckType} ${truck.currentLocation} ${truck.preferredRoute}`,
                filterValue: truck.status,
                extraFilterValue: truck.truckType,
                exportValues: [
                  truck.plateNumber,
                  `${truck.capacity} tons`,
                  truck.currentLocation,
                  truck.preferredRoute,
                  truck.priceRwf == null ? "" : formatRwf(truck.priceRwf),
                  truck.status,
                  "",
                ],
                cells: [
                  <div key={`${truck.id}-vehicle`} className="flex min-w-48 items-center gap-3">
                    <TruckThumb photos={truck.photos} alt={truck.plateNumber} className="h-12 w-16 shrink-0 rounded-lg" />
                    <span>
                      <strong className="block">{truck.plateNumber}</strong>
                      <span className="text-xs text-muted">{truck.truckType}</span>
                    </span>
                  </div>,
                  `${truck.capacity} tons`,
                  truck.currentLocation,
                  truck.preferredRoute,
                  truck.priceRwf == null ? "Price not set" : formatRwf(truck.priceRwf),
                  <span key={`${truck.id}-status`}><TruckBadge status={truck.status} /></span>,
                  <div key={`${truck.id}-actions`} className="flex justify-end">
                    <ViewLink href={`/dashboard/owner/trucks/${truck.id}`} label={`View truck ${truck.plateNumber}`} />
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
