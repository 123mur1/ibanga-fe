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

function routePoint(progress: number): [number, number] {
  const segments = [
    [[70, 325], [165, 315], [218, 282], [300, 282]],
    [[300, 282], [382, 282], [424, 250], [500, 250]],
    [[500, 250], [576, 250], [608, 219], [680, 170]],
    [[680, 170], [752, 121], [760, 118], [820, 80]],
  ];
  const scaled = Math.max(0, Math.min(0.999999, progress)) * segments.length;
  const segment = segments[Math.floor(scaled)];
  const t = scaled % 1;
  const inverse = 1 - t;
  const x = inverse ** 3 * segment[0][0]
    + 3 * inverse ** 2 * t * segment[1][0]
    + 3 * inverse * t ** 2 * segment[2][0]
    + t ** 3 * segment[3][0];
  const y = inverse ** 3 * segment[0][1]
    + 3 * inverse ** 2 * t * segment[1][1]
    + 3 * inverse * t ** 2 * segment[2][1]
    + t ** 3 * segment[3][1];
  return [x, y];
}

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
  const [truckX, truckY] = routePoint(progress);
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
        <div
          role="img"
          aria-label={`Illustrative route from ${booking.pickupLocation} to ${booking.destination}`}
          className="relative h-[26rem] overflow-hidden rounded-xl border border-line bg-[#e9f0e8]"
        >
          <svg viewBox="0 0 900 420" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
            <defs>
              <pattern id="map-grid" width="34" height="34" patternUnits="userSpaceOnUse">
                <path d="M34 0H0V34" fill="none" stroke="#d6e2d8" strokeWidth=".8" />
              </pattern>
              <filter id="marker-shadow" x="-100%" y="-100%" width="300%" height="300%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#183440" floodOpacity=".25" />
              </filter>
            </defs>
            <rect width="900" height="420" fill="#eef2e9" />
            <rect width="900" height="420" fill="url(#map-grid)" />
            <path d="M-30 78 C80 115 135 68 220 96s115 82 220 48 155-82 250-39 146 35 240-16" fill="none" stroke="#d9e9e8" strokeWidth="46" />
            <path d="M-30 78 C80 115 135 68 220 96s115 82 220 48 155-82 250-39 146 35 240-16" fill="none" stroke="#c4dedc" strokeWidth="2" />
            <path d="M20 400 C100 350 140 374 200 336s100-28 140 2 93 26 142-3 95-73 165-60 134 24 196-3" fill="none" stroke="#d7e7d8" strokeWidth="54" />
            <path d="M20 400 C100 350 140 374 200 336s100-28 140 2 93 26 142-3 95-73 165-60 134 24 196-3" fill="none" stroke="#c4d9c8" strokeWidth="2" />
            <path d="M420 -20 C390 55 465 94 438 146s-12 85 22 119 22 84-10 175" fill="none" stroke="#d5e8eb" strokeWidth="21" />
            <path d="M420 -20 C390 55 465 94 438 146s-12 85 22 119 22 84-10 175" fill="none" stroke="#b9dce2" strokeWidth="2" />
            <g fill="#dce9d6" stroke="#c8dac2" strokeWidth="1">
              <path d="M28 137l46-23 34 18-11 38-55 7z" />
              <path d="M271 44l55-13 30 25-16 42-57-5z" />
              <path d="M560 62l42-19 38 20-9 39-51 12z" />
              <path d="M690 315l48-22 42 20-14 42-57 8z" />
              <path d="M291 340l31-15 27 17-8 27-36 5z" />
            </g>
            <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">
              <path d="M-20 210 C95 167 146 201 223 170s120-68 202-40 125 80 216 58 163-72 289-30" strokeWidth="13" />
              <path d="M-20 210 C95 167 146 201 223 170s120-68 202-40 125 80 216 58 163-72 289-30" stroke="#d5cfae" strokeWidth="8" />
              <path d="M178 -25 C209 45 159 107 190 148s85 53 74 107-59 94-35 191" strokeWidth="11" />
              <path d="M178 -25 C209 45 159 107 190 148s85 53 74 107-59 94-35 191" stroke="#ddd6bd" strokeWidth="6" />
              <path d="M623 -24 C583 39 640 101 614 150s-20 94 18 128 40 77 31 168" strokeWidth="12" />
              <path d="M623 -24 C583 39 640 101 614 150s-20 94 18 128 40 77 31 168" stroke="#ddd6bd" strokeWidth="7" />
              <path d="M-22 300 C88 279 143 307 219 275s131-65 205-37 108 79 182 70 142-42 321 9" strokeWidth="9" />
              <path d="M-22 300 C88 279 143 307 219 275s131-65 205-37 108 79 182 70 142-42 321 9" stroke="#ddd6bd" strokeWidth="5" />
              <path d="M320 -18 C348 43 311 87 347 129s77 42 68 87-52 71-39 116 50 68 67 106" strokeWidth="8" />
              <path d="M320 -18 C348 43 311 87 347 129s77 42 68 87-52 71-39 116 50 68 67 106" stroke="#e2dac4" strokeWidth="4" />
              <path d="M760 -25 C732 43 780 77 754 122s-60 74-41 113 80 55 74 109 25 62 78 86" strokeWidth="9" />
              <path d="M760 -25 C732 43 780 77 754 122s-60 74-41 113 80 55 74 109 25 62 78 86" stroke="#e2dac4" strokeWidth="5" />
            </g>
            <path d="M70 325 C165 315 218 282 300 282 S424 250 500 250 608 219 680 170 760 118 820 80" fill="none" stroke="#fff" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M70 325 C165 315 218 282 300 282 S424 250 500 250 608 219 680 170 760 118 820 80" fill="none" stroke="#778b8c" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M70 325 C165 315 218 282 300 282 S424 250 500 250 608 219 680 170 760 118 820 80" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="4 9" strokeLinecap="round" />
            <path d="M70 325 C165 315 218 282 300 282 S424 250 500 250 608 219 680 170 760 118 820 80" fill="none" stroke="#087da3" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${Math.max(0.01, progress) * 1100} 1100`} />
            <g filter="url(#marker-shadow)">
              <circle cx="70" cy="325" r="12" fill="#fff" stroke="#087da3" strokeWidth="5" />
              <circle cx="820" cy="80" r="12" fill="#087da3" stroke="#fff" strokeWidth="5" />
            </g>
            <g transform={`translate(${truckX}, ${truckY})`} filter="url(#marker-shadow)">
              <circle r="23" fill="#087da3" opacity=".16" />
              <circle r="14" fill="#fff" />
              <circle r="10" fill="#087da3" />
              <path d="M-5 1h7l3 3v4h-10zM2 2h3l2 2H2z" fill="#fff" />
              <circle cx="-2" cy="9" r="1.4" fill="#183440" />
              <circle cx="5" cy="9" r="1.4" fill="#183440" />
            </g>
            <g fontFamily="Arial, sans-serif" fill="#37545a">
              <text x="68" y="122" fontSize="11" fontWeight="700" letterSpacing="1.2" opacity=".72">NORTH RIDGE</text>
              <text x="307" y="62" fontSize="10" fontWeight="700" letterSpacing="1" opacity=".68">GREEN VALLEY</text>
              <text x="625" y="350" fontSize="10" fontWeight="700" letterSpacing="1" opacity=".68">EAST DISTRICT</text>
              <text x="484" y="112" fontSize="9" fontWeight="600" opacity=".6">RIVER ROAD</text>
              <rect x="34" y="350" width="210" height="37" rx="9" fill="#fff" stroke="#d6e0dc" />
              <circle cx="51" cy="368" r="5" fill="#087da3" />
              <text x="65" y="373" fontSize="13" fontWeight="700" fill="#183440">{booking.pickupLocation}</text>
              <rect x="656" y="24" width="210" height="37" rx="9" fill="#fff" stroke="#d6e0dc" />
              <circle cx="673" cy="42" r="5" fill="#087da3" />
              <text x="687" y="47" fontSize="13" fontWeight="700" fill="#183440">{booking.destination}</text>
            </g>
          </svg>
          <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-navy shadow-sm">Illustrative route</span>
        </div>
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
