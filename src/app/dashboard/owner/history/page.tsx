"use client";

import { BookingRow } from "@/components/booking-row";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/ui";
import { RequireAuth } from "@/components/require-auth";
import { useIbanga } from "@/lib/store";

export default function OwnerHistoryPage() {
  const { currentUser, trucks, bookings } = useIbanga();
  const mine = trucks.filter((t) => t.ownerId === currentUser?.id);
  const history = bookings.filter(
    (b) =>
      ["COMPLETED", "REJECTED"].includes(b.status) &&
      mine.some((t) => t.id === b.truckId),
  );

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        <h1 className="font-display text-3xl text-navy">Trip history</h1>
        <div className="mt-6 space-y-3">
          {history.length ? (
            history.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                truck={mine.find((t) => t.id === booking.truckId)}
                href={`/dashboard/owner/trips/${booking.id}`}
              />
            ))
          ) : (
            <EmptyState
              title="No completed trips yet"
              text="Finished and rejected bookings will collect here."
            />
          )}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
