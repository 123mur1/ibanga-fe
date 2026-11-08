"use client";

import { useEffect, useRef, useState } from "react";
import { TruckCard } from "./truck-card";
import { useIsTruckVerified } from "@/hooks/use-truck-verification";
import { useIbanga } from "@/lib/store";
import { LOCATIONS, TRUCK_TYPES } from "@/lib/types";

const PAGE_SIZE = 6;

type SortKey = "default" | "price-asc" | "price-desc" | "capacity-desc";

const emptyFilters = { search: "", location: "", type: "", minCapacity: "", maxPrice: "", sort: "default" as SortKey };
type Filters = typeof emptyFilters;

const filterLabel = "mb-1.5 block text-sm font-medium text-navy";
const filterInput =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted/70 hover:border-brand/30 focus:border-brand focus:ring-2 focus:ring-brand/15";

/**
 * Search, filters and results for the available-truck marketplace. Used on the landing page,
 * the public /trucks page and the importer's "Find trucks" page.
 */
export function TruckBrowser({
  initialSearch = "",
  stickyClass = "lg:sticky lg:top-24",
}: {
  initialSearch?: string;
  /** Where the filter panel sticks while results scroll. */
  stickyClass?: string;
}) {
  const { trucks, trucksLoading } = useIbanga();
  const isVerified = useIsTruckVerified();
  const [visibleTruckCount, setVisibleTruckCount] = useState(PAGE_SIZE);
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters, search: initialSearch });

  // Importers and visitors only ever see verified trucks; the API applies the same rule.
  const availableTrucks = trucks.filter((truck) => truck.status === "AVAILABLE" && isVerified(truck));
  const query = filters.search.trim().toLowerCase();
  const words = query.split(/\s+/).filter(Boolean);
  const minCapacity = Number(filters.minCapacity) || 0;
  const maxPrice = Number(filters.maxPrice) || 0;
  const filteredTrucks = availableTrucks
    .filter((truck) => {
      const haystack = `${truck.plateNumber} ${truck.truckType} ${truck.currentLocation} ${truck.preferredRoute} ${truck.description} ${truck.owner?.name ?? ""}`.toLowerCase();
      return (
        words.every((word) => haystack.includes(word))
        && (!filters.location || truck.currentLocation.toLowerCase().includes(filters.location.toLowerCase()))
        && (!filters.type || truck.truckType === filters.type)
        && truck.capacity >= minCapacity
        && (!maxPrice || (truck.priceRwf != null && truck.priceRwf <= maxPrice))
      );
    })
    .sort((a, b) => {
      if (filters.sort === "price-asc") return (a.priceRwf ?? Infinity) - (b.priceRwf ?? Infinity);
      if (filters.sort === "price-desc") return (b.priceRwf ?? -1) - (a.priceRwf ?? -1);
      if (filters.sort === "capacity-desc") return b.capacity - a.capacity;
      return 0;
    });
  const shownTrucks = filteredTrucks.slice(0, visibleTruckCount);
  const filtersActive = JSON.stringify(filters) !== JSON.stringify(emptyFilters);
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

  // Reveal the next batch of trucks when the loading marker scrolls into view.
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
    <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
      <aside aria-label="Search and filters" className={stickyClass}>
        <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg text-navy">Search &amp; filters</h2>
            {filtersActive ? (
              <button type="button" onClick={clearFilters} className="text-sm font-semibold text-brand hover:text-brand-dark">
                Clear
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
                placeholder="Plate, route, location, owner…"
                className={filterInput}
              />
            </label>
            <label className="block">
              <span className={filterLabel}>Location</span>
              <select value={filters.location} onChange={(event) => updateFilter({ location: event.target.value })} className={filterInput}>
                <option value="">Any location</option>
                {LOCATIONS.map((location) => <option key={location}>{location}</option>)}
              </select>
            </label>
            <label className="block">
              <span className={filterLabel}>Truck type</span>
              <select value={filters.type} onChange={(event) => updateFilter({ type: event.target.value })} className={filterInput}>
                <option value="">Any type</option>
                {TRUCK_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={filterLabel}>Min. tons</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={filters.minCapacity}
                  onChange={(event) => updateFilter({ minCapacity: event.target.value })}
                  placeholder="10"
                  className={filterInput}
                />
              </label>
              <label className="block">
                <span className={filterLabel}>Max. RWF</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={filters.maxPrice}
                  onChange={(event) => updateFilter({ maxPrice: event.target.value })}
                  placeholder="1000000"
                  className={filterInput}
                />
              </label>
            </div>
            <label className="block">
              <span className={filterLabel}>Sort by</span>
              <select value={filters.sort} onChange={(event) => updateFilter({ sort: event.target.value as SortKey })} className={filterInput}>
                <option value="default">Recommended</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="capacity-desc">Capacity: largest first</option>
              </select>
            </label>
          </div>

          <p className="mt-5 border-t border-line pt-4 text-sm text-muted" aria-live="polite">
            <span className="font-semibold text-navy">{filteredTrucks.length}</span> of {availableTrucks.length} available trucks
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        {trucksLoading && !trucks.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading trucks">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-96 animate-pulse rounded-2xl border border-line bg-white" />
            ))}
          </div>
        ) : shownTrucks.length ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {shownTrucks.map((truck) => <TruckCard key={truck.id} truck={truck} />)}
            </div>
            {hasMore ? (
              <div ref={sentinelRef} role="status" aria-live="polite" className="mt-8 flex items-center justify-center gap-3 py-6 text-sm text-muted">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                Loading more trucks…
              </div>
            ) : filteredTrucks.length > PAGE_SIZE ? (
              <p className="mt-8 text-center text-sm text-muted">You have seen all {filteredTrucks.length} matching trucks.</p>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center text-sm text-muted">
            {availableTrucks.length
              ? "No available trucks match these filters."
              : "New trucks are being added to the marketplace."}
            {filtersActive ? (
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
