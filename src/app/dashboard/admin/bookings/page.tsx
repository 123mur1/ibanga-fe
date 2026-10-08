"use client";

import { BookingBadge } from "@/components/status-badge";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { LiveTripTracking } from "@/components/live-trip-tracking";
import { EmptyState, PageHeader, formatDate } from "@/components/ui";
import { useIbanga } from "@/lib/store";

export default function AdminBookingsPage() {
  const { bookings, trucks, users } = useIbanga();

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <PageHeader
          eyebrow="Marketplace"
          title="Bookings"
          subtitle="Every freight request across the marketplace, newest first."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2.5" />
              <path d="M3 9.5h18M8 3v4m8-4v4" />
            </svg>
          }
        />
        <div className="mt-6 space-y-3">
          {bookings.length ? (
            bookings.map((booking) => {
              const truck = trucks.find((t) => t.id === booking.truckId);
              const importer = users.find((u) => u.id === booking.importerId);
              return (
                <div key={booking.id} className="space-y-3">
                  <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 shadow-soft transition hover:border-brand/25 hover:shadow-card sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand [&_svg]:h-4 [&_svg]:w-4 sm:mt-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <path d="m11 13 1.5-1.5L14 13M12.5 11.5v3" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 font-semibold text-navy">
                          {booking.pickupLocation}
                          <svg className="text-brand" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                          {booking.destination}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-sm text-muted">
                          {importer?.name} · {truck?.plateNumber} ·{" "}
                          {formatDate(booking.pickupDate)} · {booking.cargoWeight}
                        </p>
                      </div>
                    </div>
                    <BookingBadge status={booking.status} />
                  </div>
                  <LiveTripTracking
                    bookingId={booking.id}
                    status={booking.status}
                    canShare={false}
                  />
                </div>
              );
            })
          ) : (
            <EmptyState
              title="No bookings yet"
              text="Freight requests appear here as importers book trucks."
            />
          )}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}