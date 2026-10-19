"use client";

import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { StatGrid } from "@/components/common/layout-blocks";
import { DemoTag } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { BarChartCard, bucketByMonth } from "@/components/charts";
import { DataTable, StatCard, ViewLink } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate, formatRwf } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { StatusFamily } from "@/config/status";
import { inRange, type DateRange } from "./overview-metrics";

type Kind = "Cargo request" | "Booking" | "Shipment";
type Row = { id: string; kind: Kind; ref: string; summary: string; date: string; status: string; family: StatusFamily; amount?: number; href: string };

const field = "rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy outline-none focus:border-brand";

/** Requests, bookings and shipments in one filterable, exportable history, plus spending by month. */
export function ReportsView() {
  const actor = useActor();
  const { bookings, trucks } = useIbanga();
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const [kind, setKind] = useState<Kind | "">("");

  const query = useServiceQuery(async () => {
    const [requests, shipments] = await Promise.all([
      services.cargoRequests.list(actor!, { pageSize: 1000 }),
      services.shipments.list(actor!, { pageSize: 1000 }),
    ]);
    return { requests: requests.items, shipments: shipments.items };
  }, [actor?.id]);

  const mine = bookings.filter((booking) => booking.importerId === actor?.id);

  return (
    <QueryBoundary query={query}>
      {(data) => {
        const rows: Row[] = [
          ...data.requests.map((request): Row => ({
            id: `r-${request.id}`, kind: "Cargo request", ref: request.ref, summary: `${request.title}: ${request.pickup.location || "—"} to ${request.delivery.location || "—"}`,
            date: request.createdAt, status: request.status, family: "cargoRequest", amount: request.budgetRwf, href: `/dashboard/importer/cargo-requests/${request.id}`,
          })),
          ...mine.map((booking): Row => ({
            id: `b-${booking.id}`, kind: "Booking", ref: booking.id, summary: `${booking.cargoType}: ${booking.pickupLocation} to ${booking.destination}`,
            date: booking.createdAt, status: booking.status, family: "booking", amount: booking.agreedPriceRwf ?? undefined, href: `/dashboard/importer/bookings/${booking.id}`,
          })),
          ...data.shipments.map((shipment): Row => {
            const booking = mine.find((item) => item.id === shipment.bookingId);
            const truck = trucks.find((item) => item.id === shipment.truckId);
            return {
              id: `s-${shipment.id}`, kind: "Shipment", ref: shipment.ref,
              summary: `${booking ? `${booking.pickupLocation} to ${booking.destination}` : shipment.bookingId}${truck ? ` · ${truck.plateNumber}` : ""}`,
              date: shipment.createdAt, status: shipment.status, family: "shipment", href: `/dashboard/importer/shipments/${shipment.id}`,
            };
          }),
        ]
          .filter((row) => inRange(row.date, range) && (!kind || row.kind === kind))
          .sort((a, b) => b.date.localeCompare(a.date));

        const paid = mine.filter((booking) => booking.payment && inRange(booking.payment.paidAt, range));
        const spent = paid.reduce((sum, booking) => sum + (booking.payment?.amountRwf ?? 0), 0);
        const count = (value: Kind) => rows.filter((row) => row.kind === value).length;

        return (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-line bg-card p-4 shadow-soft">
              <label className="text-xs font-medium text-muted">From
                <input type="date" className={`${field} mt-1 block`} value={range.from} max={range.to || undefined} onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-muted">To
                <input type="date" className={`${field} mt-1 block`} value={range.to} min={range.from || undefined} onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-muted">Record type
                <select className={`${field} mt-1 block`} value={kind} onChange={(event) => setKind(event.target.value as Kind | "")}>
                  <option value="">All records</option>
                  <option value="Cargo request">Cargo requests</option>
                  <option value="Booking">Bookings</option>
                  <option value="Shipment">Shipments</option>
                </select>
              </label>
              {range.from || range.to || kind ? (
                <button type="button" className="rounded-lg px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-soft" onClick={() => { setRange({ from: "", to: "" }); setKind(""); }}>Clear filters</button>
              ) : null}
              <span className="ml-auto"><DemoTag /></span>
            </div>

            <StatGrid columns={4}>
              <StatCard label="Cargo requests" value={count("Cargo request")} />
              <StatCard label="Bookings" value={count("Booking")} accent="accent" />
              <StatCard label="Shipments" value={count("Shipment")} accent="good" />
              <StatCard label="Spent in range" value={formatRwf(spent)} hint="Payments recorded" accent="warn" />
            </StatGrid>

            <BarChartCard
              title="Spending by month"
              caption="Payments you made, last six months"
              badge={`Total ${formatRwf(spent)}`}
              points={bucketByMonth(paid, (booking) => booking.payment?.paidAt, (booking) => booking.payment?.amountRwf ?? 0)}
              format={formatRwf}
              empty="No payments in this period."
            />

            <DataTable
              columns={[{ label: "Type" }, { label: "Reference" }, { label: "Details" }, { label: "Date" }, { label: "Amount" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
              emptyMessage="No records match these filters."
              filterLabel="All statuses"
              exportName="ibanga-importer-history"
              rows={rows.map((row) => ({
                id: row.id,
                searchText: `${row.kind} ${row.ref} ${row.summary} ${row.status}`,
                filterValue: row.status,
                extraFilterValue: row.kind,
                exportValues: [row.kind, row.ref, row.summary, formatDate(row.date), row.amount ? String(row.amount) : "", row.status, ""],
                cells: [
                  row.kind,
                  <strong key="ref" className="text-brand">{row.ref}</strong>,
                  <span key="summary" className="block min-w-48 max-w-sm whitespace-normal">{row.summary}</span>,
                  formatDate(row.date),
                  row.amount ? formatRwf(row.amount) : "—",
                  <StatusBadge key="status" family={row.family} status={row.status} />,
                  <div key="action" className="flex justify-end"><ViewLink href={row.href} label={`View ${row.kind.toLowerCase()} ${row.ref}`} /></div>,
                ],
              }))}
            />
          </div>
        );
      }}
    </QueryBoundary>
  );
}
