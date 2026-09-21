"use client";

import { BookingRow } from "@/components/booking-row";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/ui";
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
        <h1 className="font-display text-3xl text-navy">Booking requests</h1>
        <p className="mt-1 text-muted">
          A request already holds the truck. Agree the price, then accept or
          reject. Reject makes the truck available again.
        </p>
        <div className="mt-6 space-y-3">
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
              text="When an importer books one of your available trucks, it appears here."
            />
          )}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
