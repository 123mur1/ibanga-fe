"use client";

import { BookingManagementTable } from "@/components/booking-management-table";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/ui";
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
  const { currentUser, trucks, bookings, users } = useIbanga();
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
        <BookingManagementTable bookings={trips} trucks={mine} users={users} counterparty="TRUCK_OWNER" detailPath={(booking) => `/dashboard/owner/trips/${booking.id}`} />
      </DashboardShell>
    </RequireAuth>
  );
}