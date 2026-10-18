"use client";

import dynamic from "next/dynamic";
import { positionAt } from "@/lib/geo";
import type { Booking, CargoPing, TripNotice } from "@/lib/types";
import { formatDateTime } from "./ui";

const TruckMap = dynamic(() => import("./truck-map").then((module) => module.TruckMap), {
  ssr: false,
  loading: () => <div className="h-[26rem] w-full animate-pulse rounded-xl border border-line bg-background" />,
});

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
  coveredKm,
}: {
  booking: Booking;
  pings: CargoPing[];
  notices: TripNotice[];
  /** Overrides the last recorded ping so the map can follow a live position. */
  coveredKm?: number;
}) {
  const route = positionAt(booking.pickupLocation, booking.destination, 0);
  const ordered = [...pings].sort((a, b) => a.kmFromStart - b.kmFromStart || a.recordedAt.localeCompare(b.recordedAt));
  const covered = coveredKm ?? ordered.at(-1)?.kmFromStart ?? 0;
  const progress = Math.min(1, covered / route.totalKm);
  const moving = booking.status === "IN_PROGRESS";
  const timeline = [
    ...notices.map((notice) => ({
      id: notice.id,
      at: notice.at,
      title: `${kindLabel[notice.kind]} · ${notice.place}`,
      detail: notice.note,
      tone: notice.kind === "REST" ? "bg-brand-dark" : "bg-brand",
    })),
    ...ordered.map((ping) => ({
      id: ping.id,
      at: ping.recordedAt,
      title: `${kindLabel[ping.kind]} · ${ping.label}`,
      detail: ping.note || `${ping.kmFromStart} km recorded`,
      tone: ping.kind === "REST" ? "bg-brand-dark" : ping.kind === "DELIVERY" ? "bg-navy" : "bg-brand",
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-display text-lg text-navy">Live cargo location</h2>
          <p className="mt-1 text-sm text-muted">
            {booking.pickupLocation} to {booking.destination}
          </p>
        </div>
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand-dark">
          {moving ? <span className="h-2 w-2 animate-pulse rounded-full bg-brand" /> : null}
          {covered} km of {route.totalKm} km
        </p>
      </div>
      <div className="p-4">
        <TruckMap pickup={booking.pickupLocation} destination={booking.destination} progress={progress} moving={moving} />
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-6 rounded-full bg-brand" /> Travelled</span>
          <span className="inline-flex items-center gap-2"><span className="h-0.5 w-6 border-t-2 border-dashed border-brand/40" /> Remaining</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-brand ring-4 ring-brand/20" /> Truck</span>
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
