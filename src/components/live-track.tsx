"use client";

import { positionAt } from "@/lib/geo";
import type { Booking, CargoPing, TripNotice } from "@/lib/types";
import { formatDateTime } from "./ui";

const kindLabel: Record<CargoPing["kind"] | TripNotice["kind"], string> = {
  DEPARTURE: "Departure",
  CHECKPOINT: "Checkpoint",
  REST: "Rest",
  RESUME: "Back on the road",
  DELIVERY: "Delivery",
};

export function LiveTrack({
  booking,
  pings,
  notices,
}: {
  booking: Booking;
  pings: CargoPing[];
  notices: TripNotice[];
}) {
  const route = positionAt(booking.pickupLocation, booking.destination, 0);
  const ordered = [...pings].sort((a, b) => a.kmFromStart - b.kmFromStart || a.recordedAt.localeCompare(b.recordedAt));
  const latest = ordered.at(-1);
  const covered = latest?.kmFromStart ?? 0;
  const progress = Math.min(100, Math.round((covered / route.totalKm) * 100));
  const samples = Array.from({ length: 24 }, (_, index) => {
    const point = positionAt(booking.pickupLocation, booking.destination, (route.totalKm * index) / 23);
    return point;
  });
  const project = (lat: number, lng: number) => {
    const lats = samples.map((point) => point.lat);
    const lngs = samples.map((point) => point.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const x = 28 + ((lng - minLng) / Math.max(0.0001, maxLng - minLng)) * 520;
    const y = 150 - ((lat - minLat) / Math.max(0.0001, maxLat - minLat)) * 112;
    return { x, y };
  };
  const planned = samples.map((point) => project(point.lat, point.lng));
  const plannedPath = planned.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const recorded = ordered.map((ping) => project(ping.lat, ping.lng));
  const recordedPath = recorded.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const timeline = [
    ...notices.map((notice) => ({
      id: notice.id,
      at: notice.at,
      title: `${kindLabel[notice.kind]} · ${notice.place}`,
      detail: notice.note,
      tone: notice.kind === "REST" ? "bg-warn" : "bg-brand",
    })),
    ...ordered.map((ping) => ({
      id: ping.id,
      at: ping.recordedAt,
      title: `${kindLabel[ping.kind]} · ${ping.label}`,
      detail: ping.note || `${ping.kmFromStart} km recorded`,
      tone: ping.kind === "REST" ? "bg-warn" : ping.kind === "DELIVERY" ? "bg-good" : "bg-accent",
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-card shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-navy">Live cargo location</h2>
          <p className="mt-1 text-sm text-muted">
            Positions are stored at least every 2 km, with departure and rest times on the same trail.
          </p>
        </div>
        <p className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-dark">
          {covered} km of {route.totalKm} km
        </p>
      </div>
      <div className="px-5 py-4">
        <div className="h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-sm font-medium text-navy">
          <span>{booking.pickupLocation}</span>
          <span>{booking.destination}</span>
        </div>
        <svg viewBox="0 0 576 176" className="mt-4 h-44 w-full" role="img" aria-label={`Route from ${booking.pickupLocation} to ${booking.destination}, ${covered} kilometres recorded`}>
          <path d={plannedPath} fill="none" stroke="#d5e3ea" strokeWidth="6" strokeLinecap="round" />
          {recordedPath ? <path d={recordedPath} fill="none" stroke="#00628b" strokeWidth="4" strokeLinecap="round" /> : null}
          {ordered.filter((_, index) => index % 1 === 0).map((ping) => {
            const point = project(ping.lat, ping.lng);
            const rest = ping.kind === "REST";
            return (
              <circle key={ping.id} cx={point.x} cy={point.y} r={rest ? 5 : 3.5} fill={rest ? "#ea580c" : "#ffffff"} stroke={rest ? "#ea580c" : "#00628b"} strokeWidth="2">
                <title>{`${ping.label} · ${formatDateTime(ping.recordedAt)}`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-brand" /> Recorded position</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-warn" /> Rest stop</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-line" /> Planned route</span>
        </div>
      </div>
      <ol className="max-h-72 divide-y divide-line overflow-y-auto border-t border-line">
        {timeline.length === 0 ? (
          <li className="px-5 py-6 text-sm text-muted">No positions yet. The trail starts when the owner records departure.</li>
        ) : timeline.slice().reverse().map((item) => (
          <li key={item.id} className="flex gap-3 px-5 py-3">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.tone}`} />
            <div>
              <p className="text-sm font-semibold text-navy">{item.title}</p>
              <p className="text-sm text-muted">{item.detail}</p>
              <p className="text-sm text-muted">{formatDateTime(item.at)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
