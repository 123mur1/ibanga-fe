"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LiveTrack } from "@/components/live-track";
import { PaymentReceipt } from "@/components/payment-receipt";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { TripActions } from "@/components/trip-actions";
import { WorkspaceLoading } from "@/components/loading";
import { BookingBadge } from "@/components/status-badge";
import { PageHeader, StatCard, formatDate } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import { positionAt } from "@/lib/geo";
import type { Booking, CargoPing, TripNotice } from "@/lib/types";

function buildTrail(booking: Booking): { pings: CargoPing[]; notices: TripNotice[] } {
  const { totalKm } = positionAt(booking.pickupLocation, booking.destination, 0);
  const progress = booking.status === "DELIVERED" ? 1 : booking.status === "IN_PROGRESS" ? 0.62 : 0.15;
  const coveredKm = Math.max(2, Math.round(totalKm * progress));
  const steps = Math.min(12, Math.max(2, Math.round(coveredKm / Math.max(2, totalKm / 10)) + 1));
  const start = new Date(booking.createdAt).getTime();
  const pings: CargoPing[] = Array.from({ length: steps }, (_, index) => {
    const km = Math.round((coveredKm * index) / (steps - 1));
    const point = positionAt(booking.pickupLocation, booking.destination, km);
    const last = index === steps - 1;
    return {
      id: `${booking.id}-ping-${km}`,
      bookingId: booking.id,
      kmFromStart: km,
      lat: point.lat,
      lng: point.lng,
      label: km === 0 ? booking.pickupLocation : last ? "Current position" : `${km} km from ${booking.pickupLocation}`,
      recordedAt: new Date(start + index * 75 * 60 * 1000).toISOString(),
      kind: km === 0 ? "DEPARTURE" : last && booking.status === "DELIVERED" ? "DELIVERY" : "CHECKPOINT",
    };
  });
  const notices: TripNotice[] = [
    {
      id: `${booking.id}-notice-departure`,
      bookingId: booking.id,
      kind: "DEPARTURE",
      at: new Date(start).toISOString(),
      place: booking.pickupLocation,
      note: "Truck confirmed and departed with the cargo.",
    },
  ];
  return { pings, notices };
}

export default function TrackingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, bookings, trucks } = useIbanga();
  const booking = bookings.find((item) => item.id === id);
  const truck = booking ? trucks.find((item) => item.id === booking.truckId) : undefined;
  const allowed = Boolean(
    currentUser && booking && (
      currentUser.role === "ADMIN"
      || booking.importerId === currentUser.id
      || truck?.ownerId === currentUser.id
    ),
  );

  const [extraKm, setExtraKm] = useState(0);
  const moving = booking?.status === "IN_PROGRESS";

  // Simulated live movement: the truck keeps advancing while the trip is in progress.
  useEffect(() => {
    if (!moving) return;
    const timer = window.setInterval(() => setExtraKm((value) => value + 1), 2500);
    return () => window.clearInterval(timer);
  }, [moving]);

  if (!currentUser) return <WorkspaceLoading />;

  const trail = booking ? buildTrail(booking) : null;
  const route = booking ? positionAt(booking.pickupLocation, booking.destination, 0) : null;
  const recordedKm = trail?.pings.at(-1)?.kmFromStart ?? 0;
  const covered = route ? Math.min(Math.max(route.totalKm - 1, recordedKm), recordedKm + extraKm) : recordedKm;
  const progress = route && route.totalKm ? Math.round((covered / route.totalKm) * 100) : 0;

  return (
    <RequireAuth>
      <DashboardShell role={currentUser.role}>
        <Link href="/dashboard/tracking" className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-dark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          All live cargo
        </Link>

        {!booking || !allowed || !trail ? (
          <p className="mt-4 rounded-2xl border border-line bg-card px-5 py-8 text-center text-muted">This cargo trail is not available on your account.</p>
        ) : (
          <div className="mt-4 space-y-5">
            <PageHeader
              eyebrow="Cargo tracking"
              title={`${booking.pickupLocation} to ${booking.destination}`}
              subtitle={`${booking.cargoType} · ${truck?.plateNumber ?? "Truck assigned"} · Pickup ${formatDate(booking.pickupDate)}`}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
                  <circle cx="12" cy="10" r="2.4" />
                </svg>
              }
              actions={<BookingBadge status={booking.status} />}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Progress" value={`${progress}%`} hint="Of planned route" />
              <StatCard label="Distance covered" value={`${covered} km`} hint={`of ${route?.totalKm ?? 0} km`} />
              <StatCard label="Remaining" value={`${Math.max(0, (route?.totalKm ?? 0) - covered)} km`} hint="To destination" />
              <StatCard label="Payment" value={booking.payment?.status.replaceAll("_", " ") ?? "Not paid"} hint={booking.agreedPrice || "No price set"} />
            </div>

            {(currentUser.role === "TRUCK_OWNER" && truck?.ownerId === currentUser.id) || currentUser.role === "ADMIN" ? (
              <TripActions booking={booking} />
            ) : null}
            <LiveTrack booking={booking} pings={trail.pings} notices={trail.notices} coveredKm={covered} />
            <PaymentReceipt booking={booking} plate={truck?.plateNumber} />
          </div>
        )}
      </DashboardShell>
    </RequireAuth>
  );
}
