import Link from "next/link";
import { TruckVerifiedBadge } from "./status-badge";
import { TruckThumb } from "./photos";
import { formatDay, nextFreeDay, todayKey } from "@/lib/availability";
import type { BookedRange, Truck } from "@/lib/types";

function listWithMore(items: string[], shown: number) {
  if (!items.length) return "";
  const extra = items.length - shown;
  return `${items.slice(0, shown).join(", ")}${extra > 0 ? ` +${extra}` : ""}`;
}

export function TruckCard({
  truck,
  booked = [],
  rating,
}: {
  truck: Truck;
  /** Days taken by live bookings; the card shows when the vehicle is next free. */
  booked?: BookedRange[];
  rating?: { average: number; count: number };
}) {
  const freeDay = nextFreeDay(booked);
  const freeToday = freeDay === todayKey();
  const destinations = truck.destinations ?? [];
  const cargo = truck.acceptedCargo ?? [];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-soft transition duration-200 hover:-translate-y-1 hover:border-brand/30 hover:shadow-card">
      <Link
        href={`/trucks/${truck.id}`}
        aria-label={`View ${truck.truckType} ${truck.plateNumber}`}
        className="relative block overflow-hidden bg-navy/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
      >
        <TruckThumb
          photos={truck.photos}
          alt={`${truck.truckType} ${truck.plateNumber}`}
          className="aspect-16/10 rounded-none border-0 transition duration-500 group-hover:scale-[1.025]"
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${freeToday ? "bg-good-soft text-good ring-1 ring-good/20" : "bg-white/95 text-navy ring-1 ring-navy/10"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${freeToday ? "bg-good" : "bg-warn"}`} aria-hidden="true" />
            {freeToday ? "Free today" : `Next free ${formatDay(freeDay, { day: "numeric", month: "short" })}`}
          </span>
          {truck.verification ? <TruckVerifiedBadge verification={truck.verification} /> : null}
        </div>
        {truck.category ? (
          <span className="absolute bottom-3 right-3 rounded-lg bg-navy/75 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur-sm">
            {truck.category}
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/trucks/${truck.id}`} className="font-display text-lg font-semibold leading-tight text-navy decoration-brand decoration-2 underline-offset-4 hover:underline">
              {truck.truckType} · {truck.capacity} t
            </Link>
            <p className="mt-1 truncate text-sm text-muted">
              <span className="font-medium text-navy-soft">{truck.plateNumber}</span>
              <span aria-hidden="true" className="mx-1.5 text-line">/</span>
              {truck.currentLocation || "Location not set"}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Per km</p>
            <p className="mt-0.5 font-display text-base font-bold tabular-nums text-brand-dark">
              {truck.pricePerKmRwf == null ? "Not set" : `RWF ${truck.pricePerKmRwf.toLocaleString("en-RW")}`}
            </p>
          </div>
        </div>

        {rating?.count ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm">
            <span aria-hidden="true" className="text-amber-500">★</span>
            <span className="font-semibold text-navy">{rating.average.toFixed(1)}</span>
            <span className="text-muted">({rating.count} review{rating.count === 1 ? "" : "s"})</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">No reviews yet</p>
        )}

        <dl className="mt-4 space-y-2.5 rounded-xl border border-line bg-background/70 p-3 text-sm">
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide text-muted">Delivers to</dt>
            <dd className="min-w-0 truncate font-semibold text-navy" title={destinations.join(", ")}>
              {destinations.length ? listWithMore(destinations, 2) : "Not listed"}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide text-muted">Carries</dt>
            <dd className="min-w-0 truncate font-semibold text-navy" title={cargo.join(", ")}>
              {cargo.length ? listWithMore(cargo, 2) : "Any cargo"}
            </dd>
          </div>
        </dl>

        <p className="mt-4 line-clamp-2 min-h-11 text-sm leading-5 text-muted">
          {truck.description || "Ready for your next delivery."}
        </p>

        <Link
          href={`/trucks/${truck.id}`}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-center text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          View details and dates
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
