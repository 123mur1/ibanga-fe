"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TruckCard } from "./truck-card";
import { LoadingTruck } from "./loading";
import { useBookedRanges } from "@/hooks/use-booked-ranges";
import { useIsTruckVerified } from "@/hooks/use-truck-verification";
import { formatDay, isRangeFree, nextFreeDay, todayKey } from "@/lib/availability";
import { useIbanga } from "@/lib/store";
import { CARGO_TYPES, LOCATIONS, TRUCK_TYPES, VEHICLE_CATEGORIES } from "@/lib/types";

const PAGE_SIZE = 6;

type SortKey = "recommended" | "rate-asc" | "rate-desc" | "capacity-desc" | "rating-desc" | "soonest";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "rate-asc", label: "Price per km: low to high" },
  { value: "rate-desc", label: "Price per km: high to low" },
  { value: "soonest", label: "Free soonest" },
  { value: "rating-desc", label: "Best rated" },
  { value: "capacity-desc", label: "Capacity: largest first" },
];

const emptyFilters = {
  search: "",
  location: "",
  destination: "",
  category: "",
  type: "",
  cargo: "",
  minCapacity: "",
  maxRate: "",
  from: "",
  to: "",
  minRating: "",
};
type Filters = typeof emptyFilters;

const filterLabel = "mb-1.5 block text-sm font-medium text-navy";
const filterInput =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted/70 hover:border-brand/30 focus:border-brand focus:ring-2 focus:ring-brand/15";

function Select({ label, value, onChange, any, options }: { label: string; value: string; onChange: (value: string) => void; any: string; options: readonly string[] }) {
  return (
    <label className="block">
      <span className={filterLabel}>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={filterInput}>
        <option value="">{any}</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

/**
 * Search, filters and results for the vehicle marketplace. Used on the landing page, the public
 * /trucks page and the importer's "Find trucks" page. Every verified vehicle is listed whatever
 * its bookings: a vehicle is only taken on the days a booking covers, so the date filter decides.
 */
export function TruckBrowser({
  initialSearch = "",
  stickyClass = "lg:sticky lg:top-24",
}: {
  initialSearch?: string;
  /** Where the filter panel sticks while results scroll. */
  stickyClass?: string;
}) {
  const { trucks, trucksLoading, reviews } = useIbanga();
  const isVerified = useIsTruckVerified();
  const bookedFor = useBookedRanges();
  const [visibleTruckCount, setVisibleTruckCount] = useState(PAGE_SIZE);
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters, search: initialSearch });
  const [sort, setSort] = useState<SortKey>("recommended");
  const [panelOpen, setPanelOpen] = useState(false);

  const ratings = useMemo(() => {
    const totals = new Map<string, { sum: number; count: number }>();
    for (const review of reviews) {
      const total = totals.get(review.truckId) ?? { sum: 0, count: 0 };
      totals.set(review.truckId, { sum: total.sum + review.rating, count: total.count + 1 });
    }
    return new Map([...totals].map(([id, total]) => [id, { average: total.sum / total.count, count: total.count }]));
  }, [reviews]);

  // Visitors and importers only ever see verified vehicles; the API applies the same rule.
  const listedTrucks = trucks.filter((truck) => isVerified(truck));
  const words = filters.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const minCapacity = Number(filters.minCapacity) || 0;
  const maxRate = Number(filters.maxRate) || 0;
  const minRating = Number(filters.minRating) || 0;
  const from = filters.from || (filters.to ? filters.to : "");
  const to = filters.to && filters.to >= from ? filters.to : from;

  const filteredTrucks = listedTrucks
    .filter((truck) => {
      const haystack = [
        truck.plateNumber,
        truck.truckType,
        truck.category,
        truck.currentLocation,
        truck.preferredRoute,
        truck.description,
        truck.owner?.name,
        ...(truck.destinations ?? []),
        ...(truck.acceptedCargo ?? []),
      ].join(" ").toLowerCase();
      const rating = ratings.get(truck.id);
      return (
        words.every((word) => haystack.includes(word))
        && (!filters.location || truck.currentLocation.toLowerCase().includes(filters.location.toLowerCase()))
        && (!filters.destination || (truck.destinations ?? []).includes(filters.destination))
        && (!filters.category || truck.category === filters.category)
        && (!filters.type || truck.truckType === filters.type)
        && (!filters.cargo || (truck.acceptedCargo ?? []).includes(filters.cargo))
        && truck.capacity >= minCapacity
        && (!maxRate || (truck.pricePerKmRwf != null && truck.pricePerKmRwf <= maxRate))
        && (!minRating || (rating != null && rating.average >= minRating))
        && (!from || isRangeFree(from, to, bookedFor(truck)))
      );
    })
    .sort((a, b) => {
      if (sort === "rate-asc") return (a.pricePerKmRwf ?? Infinity) - (b.pricePerKmRwf ?? Infinity);
      if (sort === "rate-desc") return (b.pricePerKmRwf ?? -1) - (a.pricePerKmRwf ?? -1);
      if (sort === "capacity-desc") return b.capacity - a.capacity;
      if (sort === "rating-desc") return (ratings.get(b.id)?.average ?? 0) - (ratings.get(a.id)?.average ?? 0);
      if (sort === "soonest") return nextFreeDay(bookedFor(a)).localeCompare(nextFreeDay(bookedFor(b)));
      return 0;
    });

  const shownTrucks = filteredTrucks.slice(0, visibleTruckCount);
  const activeCount = Object.values(filters).filter(Boolean).length;
  const hasMore = shownTrucks.length < filteredTrucks.length;
  const sentinelRef = useRef<HTMLDivElement>(null);

  function updateFilter(patch: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setVisibleTruckCount(PAGE_SIZE);
  }

  function clearFilters() {
    setFilters(emptyFilters);
    setVisibleTruckCount(PAGE_SIZE);
  }

  // Reveal the next batch of vehicles when the loading marker scrolls into view.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleTruckCount((count) => count + PAGE_SIZE);
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, visibleTruckCount]);

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
      <aside aria-label="Search and filters" className={stickyClass}>
        <button
          type="button"
          onClick={() => setPanelOpen((open) => !open)}
          aria-expanded={panelOpen}
          aria-controls="vehicle-filters"
          className="flex w-full items-center justify-between rounded-2xl border border-line bg-white px-5 py-3.5 text-sm font-semibold text-navy shadow-soft lg:hidden"
        >
          <span>Search &amp; filters{activeCount ? ` (${activeCount})` : ""}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition ${panelOpen ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
        </button>

        <div id="vehicle-filters" className={`${panelOpen ? "mt-3 block" : "hidden"} rounded-2xl border border-line bg-white p-5 shadow-soft lg:mt-0 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg text-navy max-lg:sr-only">Search &amp; filters</h2>
            {activeCount ? (
              <button type="button" onClick={clearFilters} className="text-sm font-semibold text-brand hover:text-brand-dark">
                Clear all
              </button>
            ) : null}
          </div>

          <div className="mt-4 space-y-4">
            <label className="block">
              <span className={filterLabel}>Search</span>
              <input
                type="search"
                value={filters.search}
                onChange={(event) => updateFilter({ search: event.target.value })}
                placeholder="Plate, place, cargo, owner…"
                className={filterInput}
              />
            </label>

            <fieldset className="space-y-3 border-t border-line pt-4">
              <legend className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">When</legend>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={filterLabel}>Free from</span>
                  <input type="date" min={todayKey()} value={filters.from} onChange={(event) => updateFilter({ from: event.target.value })} className={filterInput} />
                </label>
                <label className="block">
                  <span className={filterLabel}>Until</span>
                  <input type="date" min={filters.from || todayKey()} value={filters.to} onChange={(event) => updateFilter({ to: event.target.value })} className={filterInput} />
                </label>
              </div>
            </fieldset>

            <fieldset className="space-y-3 border-t border-line pt-4">
              <legend className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Route</legend>
              <Select label="Vehicle is now in" any="Any location" value={filters.location} onChange={(location) => updateFilter({ location })} options={LOCATIONS} />
              <Select label="Delivers to" any="Any destination" value={filters.destination} onChange={(destination) => updateFilter({ destination })} options={LOCATIONS} />
            </fieldset>

            <fieldset className="space-y-3 border-t border-line pt-4">
              <legend className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Vehicle</legend>
              <Select label="Category" any="Any category" value={filters.category} onChange={(category) => updateFilter({ category })} options={VEHICLE_CATEGORIES} />
              <Select label="Body type" any="Any type" value={filters.type} onChange={(type) => updateFilter({ type })} options={TRUCK_TYPES} />
              <Select label="Carries" any="Any cargo" value={filters.cargo} onChange={(cargo) => updateFilter({ cargo })} options={CARGO_TYPES} />
              <label className="block">
                <span className={filterLabel}>Minimum capacity (tons)</span>
                <input type="number" min="0" inputMode="numeric" value={filters.minCapacity} onChange={(event) => updateFilter({ minCapacity: event.target.value })} placeholder="e.g. 10" className={filterInput} />
              </label>
            </fieldset>

            <fieldset className="space-y-3 border-t border-line pt-4">
              <legend className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Price and rating</legend>
              <label className="block">
                <span className={filterLabel}>Max. price per km (RWF)</span>
                <input type="number" min="0" inputMode="numeric" value={filters.maxRate} onChange={(event) => updateFilter({ maxRate: event.target.value })} placeholder="e.g. 2000" className={filterInput} />
              </label>
              <label className="block">
                <span className={filterLabel}>Rating</span>
                <select value={filters.minRating} onChange={(event) => updateFilter({ minRating: event.target.value })} className={filterInput}>
                  <option value="">Any rating</option>
                  <option value="3">3 stars and up</option>
                  <option value="4">4 stars and up</option>
                  <option value="4.5">4.5 stars and up</option>
                </select>
              </label>
            </fieldset>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            <span className="font-semibold text-navy">{filteredTrucks.length}</span> of {listedTrucks.length} vehicles
            {from ? <> free {from === to ? `on ${formatDay(from)}` : `from ${formatDay(from, { day: "numeric", month: "short" })} to ${formatDay(to)}`}</> : null}
          </p>
          <label className="flex items-center gap-2 text-sm text-muted">
            Sort by
            <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className={`${filterInput} w-auto py-1.5`}>
              {SORTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>

        {trucksLoading && !trucks.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-live="polite" aria-busy="true" aria-label="Loading vehicles">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
                <div className="loading-skeleton h-48" />
                <div className="space-y-4 p-5">
                  <div className="loading-skeleton h-5 w-3/4 rounded-md" />
                  <div className="loading-skeleton h-4 w-1/2 rounded-md" />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="loading-skeleton h-14 rounded-xl" />
                    <div className="loading-skeleton h-14 rounded-xl" />
                  </div>
                  <div className="loading-skeleton h-10 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : shownTrucks.length ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {shownTrucks.map((truck) => (
                <TruckCard key={truck.id} truck={truck} booked={bookedFor(truck)} rating={ratings.get(truck.id)} />
              ))}
            </div>
            {hasMore ? (
              <div ref={sentinelRef} role="status" aria-live="polite" className="mt-8 flex items-center justify-center gap-3 py-6 text-sm text-muted">
                <LoadingTruck className="ibanga-truck-drive h-8 w-16" />
                Loading more vehicles…
              </div>
            ) : filteredTrucks.length > PAGE_SIZE ? (
              <p className="mt-8 text-center text-sm text-muted">You have seen all {filteredTrucks.length} matching vehicles.</p>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center text-sm text-muted">
            {listedTrucks.length
              ? "No vehicles match these filters. Try other dates or fewer filters."
              : "New vehicles are being added to the marketplace."}
            {activeCount ? (
              <div className="mt-4">
                <button type="button" onClick={clearFilters} className="font-semibold text-brand hover:text-brand-dark">
                  Clear filters
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
