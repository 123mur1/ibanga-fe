"use client";

import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { DemoTag } from "@/components/common/notices";
import { StatGrid } from "@/components/common/layout-blocks";
import { statusOptions } from "@/components/common/status-badge";
import { StatCard } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatRwf } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import { computeOverview, type DateRange, type StatusFilter } from "./overview-metrics";

const filterClass = "rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy outline-none focus:border-brand";

/** Shipping KPI cards with a date range and a booking-status filter that change the numbers. */
export function ImporterKpis() {
  const actor = useActor();
  const { bookings, refunds } = useIbanga();
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [status, setStatus] = useState<StatusFilter>("ALL");

  // Private importer data is read through the services with the importer as actor.
  const query = useServiceQuery(async () => {
    const [requests, shipments] = await Promise.all([
      services.cargoRequests.list(actor!, { pageSize: 1000 }),
      services.shipments.list(actor!, { pageSize: 1000 }),
    ]);
    return { requests: requests.items, shipments: shipments.items };
  }, [actor?.id]);

  const mine = bookings.filter((booking) => booking.importerId === actor?.id);
  const myRefunds = refunds.filter((refund) => refund.importerId === actor?.id);
  const filtered = range.from !== "" || range.to !== "" || status !== "ALL";
  const invalidRange = range.from !== "" && range.to !== "" && range.to < range.from;

  return (
    <section className="mt-6" aria-labelledby="kpi-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="kpi-heading" className="font-display text-xl tracking-tight text-navy">Shipping summary <DemoTag /></h2>
          <p className="mt-1 text-sm text-muted">Dates filter every figure; status filters bookings, shipments and payments.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-medium text-muted">From
            <input type="date" className={`${filterClass} mt-1 block`} value={range.from} max={range.to || undefined} onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))} />
          </label>
          <label className="text-xs font-medium text-muted">To
            <input type="date" className={`${filterClass} mt-1 block`} value={range.to} min={range.from || undefined} onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))} />
          </label>
          <label className="text-xs font-medium text-muted">Booking status
            <select className={`${filterClass} mt-1 block`} value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
              <option value="ALL">All statuses</option>
              {statusOptions("booking").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          {filtered ? (
            <button type="button" className="rounded-lg px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-soft" onClick={() => { setRange({ from: "", to: "" }); setStatus("ALL"); }}>Clear filters</button>
          ) : null}
        </div>
      </div>
      {invalidRange ? <p role="alert" className="mt-2 text-sm font-medium text-bad">The end date is before the start date, so nothing matches.</p> : null}

      <QueryBoundary query={query}>
        {(data) => {
          const metrics = computeOverview({ requests: data.requests, bookings: mine, shipments: data.shipments, refunds: myRefunds, range, status });
          return (
            <StatGrid>
              <StatCard label="Active shipments" value={metrics.activeShipments} hint="Not yet delivered" accent="accent" href="/dashboard/importer/shipments?status=SCHEDULED,PICKUP_CONFIRMED,LOADED,DEPARTED,IN_TRANSIT,DELAYED,ARRIVED,UNLOADING" />
              <StatCard label="Completed deliveries" value={metrics.completed} hint="Delivered or completed" accent="good" href="/dashboard/importer/shipments?status=DELIVERED,COMPLETED" />
              <StatCard label="Cancelled bookings" value={metrics.cancelled} hint="Cancelled or rejected" accent="bad" href="/dashboard/importer/bookings?status=REJECTED" />
              <StatCard label="Transport spending" value={formatRwf(metrics.spendingRwf)} hint="Paid" href="/dashboard/importer/payments?status=HELD,FUNDED,AUTHORIZED,RELEASED" />
              <StatCard label="Outstanding payments" value={formatRwf(metrics.outstandingRwf)} hint={`${metrics.outstandingCount} confirmed, unpaid`} accent="warn" href="/dashboard/importer/bookings" />
              <StatCard label="Refund history" value={metrics.refundCount} hint={`${formatRwf(metrics.refundedRwf)} approved`} href="/dashboard/importer/refunds" />
              <StatCard label="Average delivery time" value={metrics.avgDeliveryDays === null ? "—" : `${metrics.avgDeliveryDays.toFixed(1)} days`} hint="Pickup to delivery proof" accent="accent" href="/dashboard/importer/shipments?status=DELIVERED,COMPLETED" />
            </StatGrid>
          );
        }}
      </QueryBoundary>
    </section>
  );
}
