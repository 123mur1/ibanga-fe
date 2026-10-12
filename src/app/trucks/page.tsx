"use client";

import Link from "next/link";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { PublicNavbar } from "@/components/public-navbar";
import { DataTable, Field, inputClass, StatCard } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import { LOCATIONS, TRUCK_TYPES } from "@/lib/types";

function TrucksPageContent() {
  const { trucks, currentUser } = useIbanga();
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [route, setRoute] = useState("");
  const [minCapacity, setMinCapacity] = useState("");

  const results = trucks.filter((truck) =>
    truck.status === "AVAILABLE" &&
    (!location || truck.currentLocation.toLowerCase().includes(location.toLowerCase())) &&
    (!type || truck.truckType === type) &&
    (!route || `${truck.currentLocation} ${truck.preferredRoute}`.toLowerCase().includes(route.toLowerCase())) &&
    (!minCapacity || truck.capacity >= Number(minCapacity)),
  );

  const listing = (
    <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <h1 className="font-display text-3xl text-navy">Available trucks</h1>
        <p className="mt-2 text-muted">
        Only trucks marked available appear here. A booking holds a truck
        until the owner rejects — or the trip is fully finished.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Available vehicles" value={trucks.filter((truck) => truck.status === "AVAILABLE").length} hint="Marketplace inventory" />
          <StatCard label="Search results" value={results.length} hint="Match your filters" accent="accent" />
          <StatCard label="Route network" value={new Set(trucks.map((truck) => truck.currentLocation)).size} hint="Origin locations" accent="good" />
        </div>
        <div className="mt-5 grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="mt-5">
          <DataTable
            columns={[{ label: "Vehicle" }, { label: "Owner" }, { label: "Capacity" }, { label: "Location" }, { label: "Route" }, { label: "Price" }, { label: "Details" }]}
            rows={results.map((truck) => ({
              id: truck.id,
              searchText: `${truck.plateNumber} ${truck.truckType} ${truck.owner?.name ?? ""} ${truck.currentLocation} ${truck.preferredRoute}`,
              filterValue: truck.status,
              exportValues: [truck.plateNumber, truck.owner?.name ?? "", `${truck.capacity} tons`, truck.currentLocation, truck.preferredRoute, truck.priceRwf == null ? "" : `RWF ${truck.priceRwf.toLocaleString()}`, ""],
              cells: [
                <span key={`${truck.id}-vehicle`}><strong className="block">{truck.plateNumber}</strong><span className="text-xs text-muted">{truck.truckType}</span></span>,
                truck.owner?.name ?? "—",
                `${truck.capacity} tons`,
                truck.currentLocation,
                truck.preferredRoute,
                truck.priceRwf == null ? "Price not set" : `RWF ${truck.priceRwf.toLocaleString("en-RW")}`,
                <Link
                  key={`${truck.id}-details`}
                  href={currentUser?.role === "IMPORTER"
                    ? `/trucks/${truck.id}`
                    : `/login?next=${encodeURIComponent(`/trucks/${truck.id}`)}`}
                  className="font-semibold text-brand hover:text-brand-dark"
                >
                  {currentUser?.role === "IMPORTER" ? "View details" : "Log in to view"}
                </Link>,
              ],
            }))}
            emptyMessage="No available trucks match these filters. Try adjusting your search."
          />
        </div>
    </main>
  );

  if (currentUser) {
    return <DashboardShell role={currentUser.role}>{listing}</DashboardShell>;
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      {listing}
      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} iBanga. Freight moves forward.</span>
          <Link href="/register?role=TRUCK_OWNER" className="font-semibold text-brand hover:text-brand-dark">List your truck</Link>
        </div>
      </footer>
    </div>
  );
}

export default function TrucksPage() {
  return <TrucksPageContent />;
}
