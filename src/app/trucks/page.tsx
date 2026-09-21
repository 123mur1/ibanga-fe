"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLink } from "@/components/brand";
import { TruckCard } from "@/components/truck-card";
import { Field, inputClass } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import { LOCATIONS, TRUCK_TYPES } from "@/lib/types";

export default function TrucksPage() {
  const { trucks, trucksLoading, currentUser, refreshTrucks } = useIbanga();
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [route, setRoute] = useState("");
  const [minCapacity, setMinCapacity] = useState("");

  useEffect(() => {
    refreshTrucks({
      location: location || undefined,
      truckType: type || undefined,
      route: route || undefined,
      minCapacity: minCapacity ? Number(minCapacity) : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, type, route, minCapacity]);

  const results = trucks;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <BrandLink />
          <Link
            href={currentUser ? "/dashboard/importer" : "/login"}
            className="text-sm font-semibold text-brand"
          >
            {currentUser ? "Dashboard" : "Log in"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl text-navy">Available trucks</h1>
        <p className="mt-2 text-muted">
        Only trucks marked available appear here. A booking holds a truck
        until the owner rejects — or the trip is fully finished.
        </p>

        <div className="mt-6 grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Location">
            <select
              className={inputClass}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">Any</option>
              {LOCATIONS.map((loc) => (
                <option key={loc}>{loc}</option>
              ))}
            </select>
          </Field>
          <Field label="Truck type">
            <select
              className={inputClass}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Any</option>
              {TRUCK_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Route contains">
            <input
              className={inputClass}
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="Mombasa"
            />
          </Field>
          <Field label="Minimum capacity (tons)">
            <input
              className={inputClass}
              type="number"
              min="0"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
              placeholder="10"
            />
          </Field>
        </div>

        <p className="mt-6 text-sm text-muted">
          {trucksLoading ? "Loading…" : `${results.length} trucks`}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((truck) => (
            <TruckCard key={truck.id} truck={truck} />
          ))}
        </div>
      </main>
    </div>
  );
}
