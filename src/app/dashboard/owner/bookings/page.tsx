"use client";

import { BookingManagementTable } from "@/components/booking-management-table";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/ui";
import { RequireAuth } from "@/components/require-auth";
import { useIbanga } from "@/lib/store";

export default function OwnerBookingsPage() {
  const { currentUser, trucks, bookings, users } = useIbanga();
  const mine = trucks.filter((truck) => truck.ownerId === currentUser?.id);
  const myBookings = bookings.filter((booking) => mine.some((truck) => truck.id === booking.truckId));

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        <PageHeader
          eyebrow="Fleet"
          title="Bookings"
          subtitle="Every booking on your trucks. Open one to accept it, start the trip or mark it delivered."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2.5" />
              <path d="M3 9.5h18M8 3v4m8-4v4" />
            </svg>
          }
        />
        <BookingManagementTable
          bookings={myBookings}
          trucks={mine}
          users={users}
          counterparty="TRUCK_OWNER"
          listHref="/dashboard/owner/bookings"
          detailPath={(booking) => `/dashboard/owner/bookings/${booking.id}`}
        />
      </DashboardShell>
    </RequireAuth>
  );
}
