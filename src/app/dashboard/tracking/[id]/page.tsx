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
import { env } from "@/config/env";
import { api } from "@/lib/api";
import { useIbanga } from "@/lib/store";
import { positionAt } from "@/lib/geo";
import type { Booking, CargoPing, TripNotice } from "@/lib/types";

type ApiLocation = { latitude: number; longitude: number; accuracy: number | null; updatedAt: string };
type GpsFix = { lat: number; lng: number; updatedAt: string };

/** A GPS fix older than this is treated as stale and the estimate is shown instead. */
const GPS_MAX_AGE_MS = 30 * 60 * 1000;

/**
 * Share of the trip covered, estimated from the schedule until GPS data is reliable: the trip is
 * assumed to run evenly from pickup to expected delivery.
 */
function estimatedProgress(booking: Booking, now: number): number {
  if (booking.status === "DELIVERED" || booking.status === "COMPLETED") return 1;
  if (booking.status !== "IN_PROGRESS") return 0;
  const start = new Date(booking.pickupDate).getTime();
  const end = new Date(booking.expectedDeliveryDate).getTime();
  if (!(end > start)) return 0.5;
  return Math.min(0.95, Math.max(0.05, (now - start) / (end - start)));
}

function buildTrail(booking: Booking, totalKm: number, progress: number): { pings: CargoPing[]; notices: TripNotice[] } {
  const coveredKm = Math.max(progress > 0 ? 2 : 0, Math.round(totalKm * progress));
  const steps = Math.min(12, Math.max(2, Math.round(coveredKm / Math.max(2, totalKm / 10)) + 1));
  const start = new Date(booking.pickupDate).getTime();
  const pings: CargoPing[] = coveredKm === 0 ? [] : Array.from({ length: steps }, (_, index) => {
    const km = Math.round((coveredKm * index) / (steps - 1));
    const point = positionAt(booking.pickupLocation, booking.destination, km);
    const last = index === steps - 1;
    return {
      id: `${booking.id}-ping-${km}`,
      bookingId: booking.id,
      kmFromStart: km,
      lat: point.lat,
      lng: point.lng,
      label: km === 0 ? booking.pickupLocation : last ? "Estimated current position" : `About ${km} km from ${booking.pickupLocation}`,
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

  const moving = booking?.status === "IN_PROGRESS";
  const [now, setNow] = useState(() => Date.now());
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [gps, setGps] = useState<GpsFix | null>(null);

  // The schedule-based estimate moves with the clock; once a minute is plenty.
  useEffect(() => {
    if (!moving) return;
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [moving]);

  // Use the GPS position the truck owner shares, when there is a recent one.
  useEffect(() => {
    if (!moving || !allowed || env.dataSource !== "api") return;
    let active = true;
    const load = () =>
      api<ApiLocation | null>(`/bookings/${encodeURIComponent(id)}/location`)
        .then((location) => {
          if (!active) return;
          const fresh = location && Date.now() - new Date(location.updatedAt).getTime() < GPS_MAX_AGE_MS;
          setGps(fresh ? { lat: location.latitude, lng: location.longitude, updatedAt: location.updatedAt } : null);
        })
        .catch(() => undefined);
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [id, moving, allowed]);

  if (!currentUser) return <WorkspaceLoading />;

  const totalKm = booking ? (routeKm ?? positionAt(booking.pickupLocation, booking.destination, 0).totalKm) : 0;
  const fraction = booking ? estimatedProgress(booking, now) : 0;
  const trail = booking ? buildTrail(booking, totalKm, fraction) : null;
  const covered = Math.round(totalKm * fraction);
  const progress = Math.round(fraction * 100);

  return (
    <RequireAuth>
      <DashboardShell role={currentUser.role}>
        <Link href="/dashboard/tracking" className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-dark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          All live trips
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
              <StatCard label="Progress" value={`${progress}%`} hint="Estimated from the schedule" />
              <StatCard label="Distance covered" value={`${covered} km`} hint={`of about ${totalKm} km by road`} />
              <StatCard label="Remaining" value={`${Math.max(0, totalKm - covered)} km`} hint="To destination" />
              <StatCard label="Payment" value={booking.payment?.status.replaceAll("_", " ") ?? "Not paid"} hint={booking.agreedPrice || "No price set"} />
            </div>

            {(currentUser.role === "TRUCK_OWNER" && truck?.ownerId === currentUser.id) || currentUser.role === "ADMIN" ? (
              <TripActions booking={booking} />
            ) : null}
            <LiveTrack booking={booking} pings={trail.pings} notices={trail.notices} coveredKm={covered} totalKm={totalKm} position={gps} onRouteKm={setRouteKm} />
            <PaymentReceipt booking={booking} plate={truck?.plateNumber} />
          </div>
        )}
      </DashboardShell>
    </RequireAuth>
  );
}
