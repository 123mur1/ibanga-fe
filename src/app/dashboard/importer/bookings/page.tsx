"use client";

import { BookingRow } from "@/components/booking-row";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/ui";
import { RequireAuth } from "@/components/require-auth";
import { useIbanga } from "@/lib/store";

export default function ImporterBookingsPage() {
  const { currentUser, bookings, trucks } = useIbanga();
  const mine = bookings.filter((b) => b.importerId === currentUser?.id);

  return (
    <RequireAuth role="IMPORTER">
      <DashboardShell role="IMPORTER">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight text-navy">My bookings</h1>
            <p className="mt-1.5 text-sm text-muted">
              Follow each request from pending to completed or disputed.
            </p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {mine.length ? (
            mine.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                truck={trucks.find((t) => t.id === booking.truckId)}
                href={`/dashboard/importer/bookings/${booking.id}`}
              />
            ))
          ) : (
            <EmptyState
              title="No bookings yet"
              text="Find an available truck, call the owner, then submit a request."
            />
          )}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
