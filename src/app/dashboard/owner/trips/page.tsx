"use client";

import { BookingRow } from "@/components/booking-row";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState, PageHeader } from "@/components/ui";
import { RequireAuth } from "@/components/require-auth";
import { useIbanga } from "@/lib/store";
import type { BookingStatus } from "@/lib/types";

const TRIP_STATUSES: BookingStatus[] = [
  "ACCEPTED",
  "IN_PROGRESS",
  "DELIVERED",
  "DISPUTED",
];

export default function OwnerTripsPage() {
  const { currentUser, trucks, bookings } = useIbanga();
  const mine = trucks.filter((t) => t.ownerId === currentUser?.id);
  const trips = bookings.filter(
    (b) =>
      TRIP_STATUSES.includes(b.status) &&
      mine.some((t) => t.id === b.truckId),
  );

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        <PageHeader
          eyebrow="On the road"
          title="Active trips"
          subtitle="Update status as you start and deliver. The truck stays unavailable until the importer confirms — or admin closes a dispute."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="6" cy="19" r="2.5" />
              <circle cx="18" cy="5" r="2.5" />
              <path d="M8.5 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
            </svg>
          }
        />
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          {trips.length} trips in progress
        </p>
        <div className="mt-4 space-y-3">
          {trips.length ? (
            trips.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                truck={mine.find((t) => t.id === booking.truckId)}
                href={`/dashboard/owner/trips/${booking.id}`}
              />
            ))
          ) : (
            <EmptyState
              title="No active trips"
              text="Accepted bookings will show here until they are completed or disputed."
            />
          )}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}