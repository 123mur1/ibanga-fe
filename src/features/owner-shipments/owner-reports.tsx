"use client";

import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { controlClass, FormField } from "@/components/common/form-fields";
import { StatGrid } from "@/components/common/layout-blocks";
import { BarChartCard, bucketByMonth } from "@/components/charts";
import { DataTable, GhostButton, StatCard } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { downloadExcel } from "@/lib/excel";
import { formatPercent, formatRwf, formatRwfCompact } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { Shipment } from "@/types/ops";

const DONE = ["DELIVERED", "COMPLETED"];
const ALL_STATUSES = ["SCHEDULED", "PICKUP_CONFIRMED", "LOADED", "DEPARTED", "IN_TRANSIT", "DELAYED", "ARRIVED", "UNLOADING", "DELIVERED", "COMPLETED", "CANCELLED"];

/** A finished trip counts as on time when no delay was ever reported on it. */
const onTime = (shipment: Shipment) => !shipment.milestones.some((item) => item.kind === "DELAY");
const rate = (shipments: Shipment[]) => {
  const done = shipments.filter((item) => DONE.includes(item.status));
  return done.length ? (done.filter(onTime).length / done.length) * 100 : null;
};

export function OwnerReports() {
  const actor = useActor();
  const { trucks, currentUser } = useIbanga();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const query = useServiceQuery(
    async () => {
      const [shipments, settlements, drivers, profiles] = await Promise.all([
        services.shipments.list(actor!, { pageSize: 500 }),
        services.settlements.list(actor!, { pageSize: 500 }),
        services.drivers.list(actor!, { pageSize: 500 }),
        services.trucks.listProfiles(actor!),
      ]);
      return { shipments: shipments.items, settlements: settlements.items, drivers: drivers.items, profiles };
    },
    [actor?.id],
  );
  const myTrucks = trucks.filter((truck) => truck.ownerId === currentUser?.id);

  return (
    <div className="mt-6 space-y-6">
      <QueryBoundary query={query} loadingLabel="Building your report">
        {(data) => {
          const inRange = (iso: string) => (!from || iso.slice(0, 10) >= from) && (!to || iso.slice(0, 10) <= to);
          const shipments = data.shipments.filter((item) => inRange(item.createdAt) && (!status || item.status === status));
          const settlements = data.settlements.filter((item) => inRange(item.createdAt));
          const completed = shipments.filter((item) => DONE.includes(item.status));
          const onTimeRate = rate(shipments);
          const earned = settlements.filter((item) => item.status !== "NOT_ELIGIBLE").reduce((sum, item) => sum + item.netAmountRwf, 0);
          const driverRows = data.drivers.map((driver) => {
            const trips = shipments.filter((item) => item.driverId === driver.id);
            return { driver, trips: trips.length, done: trips.filter((item) => DONE.includes(item.status)).length, onTime: rate(trips) };
          });
          const truckRows = myTrucks.map((truck) => {
            const trips = shipments.filter((item) => item.truckId === truck.id);
            return { truck, trips: trips.length, profile: data.profiles.find((item) => item.truckId === truck.id) };
          });
          const exportSummary = () =>
            downloadExcel("ibanga-owner-performance", ["Metric", "Value"], [
              ["Trips in report", shipments.length],
              ["Trips completed", completed.length],
              ["On-time rate", onTimeRate === null ? "n/a" : formatPercent(onTimeRate)],
              ["Net earnings", earned],
            ]);

          return (
            <>
              <div className="grid gap-3 rounded-2xl border border-line bg-card p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
                <FormField label="From">
                  <input type="date" className={controlClass} value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} />
                </FormField>
                <FormField label="To">
                  <input type="date" className={controlClass} value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} />
                </FormField>
                <FormField label="Shipment status">
                  <select className={controlClass} value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">All statuses</option>
                    {ALL_STATUSES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ").toLowerCase()}</option>)}
                  </select>
                </FormField>
                <div className="flex items-end gap-2">
                  <GhostButton type="button" onClick={() => { setFrom(""); setTo(""); setStatus(""); }}>Clear filters</GhostButton>
                  <GhostButton type="button" onClick={exportSummary}>Export summary</GhostButton>
                </div>
              </div>

              <StatGrid>
                <StatCard label="Trips in report" value={shipments.length} hint="Matching filters" />
                <StatCard label="Trips completed" value={completed.length} hint="Delivered or completed" accent="good" />
                <StatCard label="On-time rate" value={onTimeRate === null ? "No data" : formatPercent(onTimeRate)} hint="Completed trips without a delay" accent="accent" />
                <StatCard label="Net earnings" value={formatRwf(earned)} hint="After fees" accent="warn" />
              </StatGrid>

              <BarChartCard
                title="Earnings by month"
                caption="Net settlement amounts by month created."
                points={bucketByMonth(settlements.filter((item) => item.status !== "NOT_ELIGIBLE"), (item) => item.createdAt, (item) => item.netAmountRwf)}
                format={formatRwfCompact}
                empty="No earnings in this period yet."
              />

              <section aria-labelledby="drivers">
                <h2 id="drivers" className="mb-3 font-display text-lg text-navy">Driver performance</h2>
                <DataTable
                  columns={[{ label: "Driver" }, { label: "Trips" }, { label: "Completed" }, { label: "On-time (period)" }, { label: "Lifetime on-time" }, { label: "Rating" }]}
                  emptyMessage="You have no drivers yet."
                  exportName="ibanga-driver-performance"
                  rows={driverRows.map(({ driver, trips, done, onTime: driverRate }) => ({
                    id: driver.id,
                    searchText: driver.name,
                    exportValues: [driver.name, String(trips), String(done), driverRate === null ? "n/a" : formatPercent(driverRate), formatPercent(driver.onTimeRate), String(driver.rating)],
                    cells: [<strong key="n">{driver.name}</strong>, trips, done, driverRate === null ? "No data" : formatPercent(driverRate), formatPercent(driver.onTimeRate), driver.rating.toFixed(1)],
                  }))}
                />
              </section>

              <section aria-labelledby="trucks">
                <h2 id="trucks" className="mb-3 font-display text-lg text-navy">Truck utilisation</h2>
                <DataTable
                  columns={[{ label: "Truck" }, { label: "Type" }, { label: "Trips in period" }, { label: "Utilisation, last 30 days" }, { label: "Lifetime trips" }]}
                  emptyMessage="You have no trucks yet."
                  exportName="ibanga-truck-utilisation"
                  rows={truckRows.map(({ truck, trips, profile }) => ({
                    id: truck.id,
                    searchText: `${truck.plateNumber} ${truck.truckType}`,
                    exportValues: [truck.plateNumber, truck.truckType, String(trips), profile ? formatPercent(profile.utilizationPct) : "n/a", String(profile?.tripsCompleted ?? 0)],
                    cells: [
                      <strong key="p">{truck.plateNumber}</strong>,
                      truck.truckType,
                      trips,
                      profile ? (
                        <span key="u" className="flex min-w-32 items-center gap-2">
                          <span className="h-2 flex-1 rounded-full bg-line" aria-hidden="true"><span className="block h-2 rounded-full bg-brand" style={{ width: `${Math.min(100, profile.utilizationPct)}%` }} /></span>
                          <span className="tabular-nums">{formatPercent(profile.utilizationPct)}</span>
                        </span>
                      ) : "No data",
                      profile?.tripsCompleted ?? 0,
                    ],
                  }))}
                />
              </section>
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
