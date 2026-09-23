"use client";

import { BookingRow } from "@/components/booking-row";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState, PageHeader } from "@/components/ui";
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
        <PageHeader
          eyebrow="Trip log"
          title="Trip history"
          subtitle="Finished and rejected bookings collect here for your records."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3.5 12a8.5 8.5 0 1 1 2.5 6" />
              <path d="M3.5 15.5V11H8" />
              <path d="M12 7v5l3 2" />
            </svg>
          }
        />
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-line px-3 py-1 text-xs font-semibold text-muted">
          {history.length} recorded trips
        </p>
        <div className="mt-4 space-y-3">
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