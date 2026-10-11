"use client";

import { BookingManagementTable } from "@/components/booking-management-table";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/ui";
import { RequireAuth } from "@/components/require-auth";
import { useIbanga } from "@/lib/store";

export default function OwnerRequestsPage() {
  const { currentUser, trucks, bookings, users } = useIbanga();
  const mine = trucks.filter((t) => t.ownerId === currentUser?.id);
  const requests = bookings.filter(
    (b) =>
      b.status === "PENDING" && mine.some((t) => t.id === b.truckId),
  );

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        <PageHeader
          eyebrow="Inbox"
          title="Booking requests"
          subtitle="Each request uses the RWF price on your truck listing. Accept or reject; importers pay before the trip starts."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 13h5l1.5 2.5h5L16 13h5" />
              <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
            </svg>
          }
        />
        <BookingManagementTable bookings={requests} trucks={mine} users={users} counterparty="TRUCK_OWNER" detailPath={(booking) => `/dashboard/owner/trips/${booking.id}`} />
      </DashboardShell>
    </RequireAuth>
  );
}