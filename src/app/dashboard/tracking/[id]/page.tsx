"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { LiveTrack } from "@/components/live-track";
import { PaymentReceipt } from "@/components/payment-receipt";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { TripActions } from "@/components/trip-actions";
import { WorkspaceLoading } from "@/components/loading";
import { BookingBadge } from "@/components/status-badge";
import { useIbanga } from "@/lib/store";

export default function TrackingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, bookings, trucks, pings, notices } = useIbanga();
  const booking = bookings.find((item) => item.id === id);
  const truck = booking ? trucks.find((item) => item.id === booking.truckId) : undefined;
  const allowed = Boolean(
    currentUser && booking && (
      currentUser.role === "ADMIN"
      || booking.importerId === currentUser.id
      || truck?.ownerId === currentUser.id
    ),
  );

  if (!currentUser) return <WorkspaceLoading />;

  return (
    <RequireAuth>
      <DashboardShell role={currentUser.role}>
        <Link href="/dashboard/tracking" className="text-sm font-semibold text-brand hover:text-brand-dark">All live cargo</Link>
        {!booking || !allowed ? (
          <p className="mt-4 rounded-2xl border border-line bg-card px-5 py-8 text-center text-muted">This cargo trail is not available on your account.</p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-navy">{booking.pickupLocation} to {booking.destination}</h1>
                <p className="mt-1 text-sm text-muted">{booking.cargoType} · {truck?.plateNumber ?? "Truck assigned"}</p>
              </div>
              <BookingBadge status={booking.status} />
            </div>
            {(currentUser.role === "TRUCK_OWNER" && truck?.ownerId === currentUser.id) || currentUser.role === "ADMIN" ? (
              <TripActions booking={booking} />
            ) : null}
            <LiveTrack booking={booking} pings={pings.filter((ping) => ping.bookingId === booking.id)} notices={notices.filter((notice) => notice.bookingId === booking.id)} />
            <PaymentReceipt booking={booking} plate={truck?.plateNumber} />
          </div>
        )}
      </DashboardShell>
    </RequireAuth>
  );
}
