"use client";

import { BookingRow } from "@/components/booking-row";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState, PageHeader } from "@/components/ui";
import { RequireAuth } from "@/components/require-auth";
import { useIbanga } from "@/lib/store";

export default function OwnerRequestsPage() {
  const { currentUser, trucks, bookings } = useIbanga();
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
          subtitle="A request already holds the truck. Agree the price, then accept or reject. Reject makes the truck available again."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 13h5l1.5 2.5h5L16 13h5" />
              <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
            </svg>
          }
        />
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          {requests.length} waiting for your decision
        </p>
        <div className="mt-4 space-y-3">
          {requests.length ? (
            requests.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                truck={mine.find((t) => t.id === booking.truckId)}
                href={`/dashboard/owner/trips/${booking.id}`}
              />
            ))
          ) : (
            <EmptyState
              title="No pending requests"
              text="When an importer books one of your available trucks, it appears here for you to accept or reject."
            />
          )}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}