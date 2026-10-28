import Link from "next/link";
import { TruckBadge, TruckVerifiedBadge } from "./status-badge";
import { TruckThumb } from "./photos";
import type { Truck } from "@/lib/types";

export function TruckCard({ truck }: { truck: Truck }) {
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
          className="aspect-[16/10] rounded-none border-0 transition duration-500 group-hover:scale-[1.025]"
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <TruckBadge status={truck.status} />
          <TruckVerifiedBadge verification={truck.verification} />
        </div>
        {(truck.photoCount ?? truck.photos?.length) > 1 ? null : (
          <span className="absolute bottom-3 right-3 rounded-lg bg-navy/75 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur-sm">
            {truck.truckType}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/trucks/${truck.id}`} className="font-display text-lg font-semibold leading-tight text-navy decoration-brand decoration-2 underline-offset-4 hover:underline">
              {truck.truckType}
            </Link>
            <p className="mt-1 truncate text-sm text-muted">
              <span className="font-medium text-navy-soft">{truck.plateNumber}</span>
              <span aria-hidden="true" className="mx-1.5 text-line">/</span>
              {truck.currentLocation}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Per booking</p>
            <p className="mt-0.5 font-display text-base font-bold tabular-nums text-brand-dark">
              {truck.priceRwf == null ? "Price required" : `RWF ${truck.priceRwf.toLocaleString("en-RW")}`}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 divide-x divide-line rounded-xl border border-line bg-background/70 py-3">
          <div className="px-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Capacity</p>
            <p className="mt-0.5 text-sm font-semibold text-navy">{truck.capacity} tons</p>
          </div>
          <div className="min-w-0 px-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Route</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-navy" title={truck.preferredRoute}>{truck.preferredRoute}</p>
          </div>
        </div>

        <p className="mt-4 line-clamp-2 min-h-[2.75rem] text-sm leading-5 text-muted">
          {truck.description || "Ready for your next delivery."}
        </p>

        <Link
          href={`/trucks/${truck.id}`}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-center text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          View truck details
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
