"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TruckCard } from "./truck-card";
import { PublicNavbar } from "./public-navbar";
import { useIbanga } from "@/lib/store";
import { ACTIVE_BOOKING_STATUSES, LOCATIONS, TRUCK_TYPES } from "@/lib/types";

const PAGE_SIZE = 6;

type SortKey = "default" | "price-asc" | "price-desc" | "capacity-desc";

const emptyFilters = { search: "", location: "", type: "", minCapacity: "", maxPrice: "", sort: "default" as SortKey };

const filterLabel = "mb-1.5 block text-sm font-medium text-navy";
const filterInput =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted/70 hover:border-brand/30 focus:border-brand focus:ring-2 focus:ring-brand/15";

const heroSlides = [
  {
    image: "/photos/ibanga-container-highway.png",
    eyebrow: "Freight moves forward",
    title: "The right truck for every journey.",
    text: "Find dependable regional transport, compare clear prices, and keep every booking in one place.",
  },
  {
    image: "/photos/ibanga-container-yard.png",
    eyebrow: "A clearer way to move cargo",
    title: "Connect your cargo to the road.",
    text: "Bring importers and verified truck owners together with simple, transparent freight booking.",
  },
  {
    image: "/photos/ibanga-reefer.png",
    eyebrow: "Built for business",
    title: "From first booking to final delivery.",
    text: "Track the journey, stay in control, and keep your logistics moving with iBanga.",
  },
];

export function LandingPage() {
  const { trucks, bookings } = useIbanga();
  const [activeSlide, setActiveSlide] = useState(0);
  const [visibleTruckCount, setVisibleTruckCount] = useState(PAGE_SIZE);
  const [filters, setFilters] = useState(emptyFilters);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % heroSlides.length),
      5500,
    );
    return () => window.clearInterval(timer);
  }, []);

  const availableTrucks = trucks.filter((truck) => truck.status === "AVAILABLE");
  const query = filters.search.trim().toLowerCase();
  const minCapacity = Number(filters.minCapacity) || 0;
  const maxPrice = Number(filters.maxPrice) || 0;
  const filteredTrucks = availableTrucks
    .filter((truck) =>
      (!query || `${truck.plateNumber} ${truck.truckType} ${truck.currentLocation} ${truck.preferredRoute} ${truck.description}`.toLowerCase().includes(query))
      && (!filters.location || truck.currentLocation.toLowerCase().includes(filters.location.toLowerCase()))
      && (!filters.type || truck.truckType === filters.type)
      && truck.capacity >= minCapacity
      && (!maxPrice || (truck.priceRwf != null && truck.priceRwf <= maxPrice)),
    )
    .sort((a, b) => {
      if (filters.sort === "price-asc") return (a.priceRwf ?? Infinity) - (b.priceRwf ?? Infinity);
      if (filters.sort === "price-desc") return (b.priceRwf ?? -1) - (a.priceRwf ?? -1);
      if (filters.sort === "capacity-desc") return b.capacity - a.capacity;
      return 0;
    });
  const featuredTrucks = filteredTrucks.slice(0, visibleTruckCount);
  const filtersActive = JSON.stringify(filters) !== JSON.stringify(emptyFilters);

  function updateFilter(patch: Partial<typeof emptyFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setVisibleTruckCount(PAGE_SIZE);
  }

  function clearFilters() {
    setFilters(emptyFilters);
    setVisibleTruckCount(PAGE_SIZE);
  }
  const availableTruckCount = availableTrucks.length;
  const hasMore = featuredTrucks.length < filteredTrucks.length;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const activeLoadCount = bookings.filter((booking) =>
    ACTIVE_BOOKING_STATUSES.includes(booking.status),
  ).length;
  const slide = heroSlides[activeSlide];

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
    <div className="min-h-screen bg-white text-foreground">
      <PublicNavbar />

      <main>
        <section
          id="home"
          aria-label="iBanga freight marketplace"
          className="relative isolate flex min-h-[600px] items-center overflow-hidden bg-navy sm:min-h-[660px]"
        >
          {heroSlides.map((item, index) => (
            <div
              key={item.image}
              aria-hidden="true"
              className={`absolute inset-0 -z-10 bg-cover bg-center transition-opacity duration-1000 ${activeSlide === index ? "opacity-100" : "opacity-0"}`}
              style={{ backgroundImage: `url("${item.image}")` }}
            />
          ))}
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#062839]/90 via-[#06334b]/70 to-[#06334b]/25" />
          <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:px-12">
            <div key={slide.title} className="max-w-3xl animate-fade-in">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-sky-300" />
                {slide.eyebrow}
              </p>
              <h1 className="mt-6 max-w-3xl font-display text-4xl leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
                {slide.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/85 sm:text-lg sm:leading-8">
                {slide.text}
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="#available-trucks" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-50">
                  Browse available trucks
                </Link>
                <Link href="/register?role=TRUCK_OWNER" className="rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20">
                  List your truck
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-2" aria-label="Hero slides">
                {heroSlides.map((item, index) => (
                  <button
                    key={item.image}
                    type="button"
                    aria-label={`Show slide ${index + 1}`}
                    aria-current={activeSlide === index}
                    onClick={() => setActiveSlide(index)}
                    className={`h-2.5 rounded-full transition-all ${activeSlide === index ? "w-9 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"}`}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-1">
              <article className="rounded-2xl border border-white/20 bg-white/10 p-3 text-white shadow-xl backdrop-blur-md sm:p-5 lg:flex lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-200 sm:text-xs sm:tracking-[0.18em]">Loads</p>
                  <p className="mt-2 font-display text-2xl font-bold sm:text-4xl">{activeLoadCount}</p>
                  <p className="mt-1 text-[10px] leading-4 text-white/75 sm:text-sm">Active bookings</p>
                </div>
              </article>
              <article className="rounded-2xl border border-white/20 bg-white/10 p-3 text-white shadow-xl backdrop-blur-md sm:p-5 lg:flex lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-200 sm:text-xs sm:tracking-[0.18em]">Trucks</p>
                  <p className="mt-2 font-display text-2xl font-bold sm:text-4xl">{availableTruckCount}</p>
                  <p className="mt-1 text-[10px] leading-4 text-white/75 sm:text-sm">Available now</p>
                </div>
              </article>
              <article className="rounded-2xl border border-white/20 bg-white/10 p-3 text-white shadow-xl backdrop-blur-md sm:p-5 lg:flex lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-200 sm:text-xs sm:tracking-[0.18em]">Reliability</p>
                  <p className="mt-2 font-display text-2xl font-bold sm:text-3xl">Live</p>
                  <p className="mt-1 text-[10px] leading-4 text-white/75 sm:text-sm">Booking updates</p>
                </div>
              </article>
            </div>
          </div>
          <span className="absolute bottom-0 left-0 h-1 w-full bg-white/10">
            <span key={activeSlide} className="block h-full origin-left animate-slide-progress bg-sky-300" />
          </span>
        </section>

        <section id="available-trucks" className="scroll-mt-24 bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Ready to move</p>
              <h2 className="mt-2 font-display text-3xl tracking-tight text-navy sm:text-4xl">Available trucks</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                Explore transport options, review their routes and listed rates, and choose the right fit for your cargo.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
              <aside aria-label="Search and filters" className="lg:sticky lg:top-24">
                <div className="rounded-2xl border border-line bg-white p-5 shadow-soft lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg text-navy">Search &amp; filters</h3>
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
                        placeholder="Plate, route, owner…"
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
                        <span className={filterLabel}>Max. price (RWF)</span>
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
                {featuredTrucks.length ? (
                  <>
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {featuredTrucks.map((truck) => <TruckCard key={truck.id} truck={truck} />)}
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
          </div>
        </section>
      </main>

      <footer className="bg-[#06334b] text-white">
        <div id="contact" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
          <div className="mb-7 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-200">Contact iBanga</p>
            <h2 className="mt-2 font-display text-2xl text-white sm:text-3xl">We’re here to help your freight move.</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              For marketplace questions or support with a booking, reach out using the contact details below.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <section className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Telephones</h3>
              <a href="tel:+250780000001" className="mt-3 block text-base font-semibold text-white hover:text-sky-200">+250 780 000 001</a>
              <a href="tel:+250788441220" className="mt-2 block text-base font-semibold text-white hover:text-sky-200">+250 788 441 220</a>
            </section>
            <section className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Email &amp; reception</h3>
              <a href="mailto:admin@ibanga.com" className="mt-3 block break-all text-base font-semibold text-white hover:text-sky-200">admin@ibanga.com</a>
              <p className="mt-2 text-xs leading-5 text-white/60">For general enquiries and reception.</p>
            </section>
            <section className="rounded-2xl border border-white/15 bg-white/5 p-5 sm:col-span-2 lg:col-span-1">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Address</h3>
              <address className="mt-3 text-base font-semibold not-italic leading-6 text-white">KN 85 Street<br />Nyarugenge, Kigali<br />Rwanda</address>
            </section>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
            <span>© {new Date().getFullYear()} iBanga. Freight moves forward.</span>
            <span>Built for the regional logistics community.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
