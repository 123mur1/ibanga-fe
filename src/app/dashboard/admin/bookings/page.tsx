"use client";

import { BookingBadge } from "@/components/status-badge";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { formatDate } from "@/components/ui";
import { useIbanga } from "@/lib/store";

export default function AdminBookingsPage() {
  const { bookings, trucks, users } = useIbanga();

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight text-navy">Bookings</h1>
            <p className="mt-1.5 text-sm text-muted">
              Every freight request across the marketplace.
            </p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {bookings.map((booking) => {
            const truck = trucks.find((t) => t.id === booking.truckId);
            const importer = users.find((u) => u.id === booking.importerId);
            return (
              <div
                key={booking.id}
                className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-navy">
                    {booking.pickupLocation} → {booking.destination}
                  </p>
                  <p className="text-sm text-muted">
                    {importer?.name} · {truck?.plateNumber} ·{" "}
                    {formatDate(booking.pickupDate)}
                  </p>
                </div>
                <BookingBadge status={booking.status} />
              </div>
            );
          })}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
