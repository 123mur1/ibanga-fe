"use client";

import Link from "next/link";
import { TruckThumb } from "@/components/photos";
import { TruckVerifiedBadge } from "@/components/status-badge";
import { EmptyNote, Icon, Panel, PanelLink } from "@/features/importer-dashboard/kit";
import { useBookedRanges } from "@/hooks/use-booked-ranges";
import { formatDay, nextFreeDay, todayKey } from "@/lib/availability";
import type { Truck } from "@/lib/types";

/**
 * One card per truck. A truck is never off the market as a whole: only the days a live booking
 * covers are taken, so the card shows the next free day and the booked dates ahead.
 */
export function FleetCards({ trucks }: { trucks: Truck[] }) {
  const bookedFor = useBookedRanges();
  const today = todayKey();
  return (
    <Panel
      title="Your fleet"
      subtitle="Trucks stay bookable; only booked dates are taken."
      action={<PanelLink href="/dashboard/owner/trucks">Manage trucks</PanelLink>}
    >
      {trucks.length === 0 ? (
        <EmptyNote
          title="No trucks yet"
          text="Add a truck with its photos, rate per km and the places it serves. Once verified it appears on the marketplace."
          action={
            <Link href="/dashboard/owner/trucks/new" className="inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
              Add a truck
            </Link>
          }
        />
      ) : (
        <ul className="stagger grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {trucks.map((truck) => {
            const ranges = bookedFor(truck).filter((range) => range.end >= today);
            const free = nextFreeDay(ranges, today);
            const freeToday = free === today;
            return (
              <li key={truck.id}>
                <Link
                  href={`/dashboard/owner/trucks/${truck.id}`}
                  className="group block h-full overflow-hidden rounded-2xl border border-line bg-card transition duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-card"
                >
                  <div className="relative h-28 overflow-hidden bg-brand-soft">
                    <TruckThumb photos={truck.photos} alt={truck.plateNumber} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span
                      className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-soft ${freeToday ? "bg-good-soft text-good" : "bg-white text-brand-dark"}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${freeToday ? "bg-good" : "bg-brand"}`} />
                      {freeToday ? "Free today" : `Free from ${formatDay(free, { day: "numeric", month: "short" })}`}
                    </span>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy group-hover:text-brand">{truck.plateNumber}</p>
                        <p className="truncate text-xs text-muted">
                          {truck.truckType} · {truck.capacity} t · now in {truck.currentLocation || "—"}
                        </p>
                      </div>
                      <TruckVerifiedBadge verification={truck.verification} />
                    </div>
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                        <Icon name="calendar" className="h-3.5 w-3.5" /> Booked ahead
                      </p>
                      {ranges.length ? (
                        <ul className="mt-1.5 flex flex-wrap gap-1.5">
                          {ranges.slice(0, 4).map((range) => (
                            <li key={`${range.start}-${range.end}`} className="rounded-lg bg-brand-soft px-2 py-1 text-xs font-medium text-brand-dark">
                              {formatDay(range.start, { day: "numeric", month: "short" })}
                              {range.end !== range.start ? ` – ${formatDay(range.end, { day: "numeric", month: "short" })}` : ""}
                            </li>
                          ))}
                          {ranges.length > 4 ? <li className="px-1 py-1 text-xs text-muted">+{ranges.length - 4} more</li> : null}
                        </ul>
                      ) : (
                        <p className="mt-1 text-sm text-muted">No bookings ahead: every day is open.</p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
