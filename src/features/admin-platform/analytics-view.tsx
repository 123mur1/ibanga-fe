"use client";

import { useState } from "react";
import { BarChartCard, bucketByMonth, DonutCard, LineChartCard } from "@/components/charts";
import { controlClass } from "@/components/common/form-fields";
import { StatGrid } from "@/components/common/layout-blocks";
import { SimulationNotice } from "@/components/common/notices";
import { statusOptions } from "@/components/common/status-badge";
import { PageHeader, StatCard } from "@/components/ui";
import { useOps } from "@/hooks/use-ops";
import { downloadExcel } from "@/lib/excel";
import { formatRwf, formatRwfCompact } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import type { ShipmentStatus } from "@/types/ops";
import { computeKpis, disputeStatusMix, kpiRows, scope, shipmentStatusMix, type AnalyticsFilters, type AnalyticsInput } from "./analytics";
import { useNow } from "./use-now";

const COLORS = ["#00628b", "#3f86a5", "#8fbdd0", "#cfe6ef", "#0b2a3d", "#6b7f8c"];
const LABELS: Record<string, string> = {
  OPEN: "Open", UNDER_REVIEW: "Under review", AWAITING_INFO: "Awaiting info", ESCALATED: "Escalated", RESOLVED: "Resolved", REJECTED: "Rejected",
  SCHEDULED: "Scheduled", IN_TRANSIT: "In transit", DELAYED: "Delayed", DELIVERED: "Delivered", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

export function AnalyticsView() {
  const ops = useOps();
  const { users, trucks, bookings, refunds } = useIbanga();
  const now = useNow();
  const [filters, setFilters] = useState<AnalyticsFilters>({ from: "", to: "", shipmentStatus: "" });
  const input: AnalyticsInput = { users, trucks, bookings, refunds, ops, now: new Date(now) };

  const kpis = computeKpis(input, filters);
  const data = scope(input, filters);
  const filtered = Boolean(filters.from || filters.to || filters.shipmentStatus);
  const set = (patch: Partial<AnalyticsFilters>) => setFilters((current) => ({ ...current, ...patch }));
  const invalidRange = Boolean(filters.from && filters.to && filters.from > filters.to);

  return (
    <>
      <PageHeader
        eyebrow="Insight"
        title="Reports & analytics"
        subtitle="Platform figures derived from marketplace and operations data. Use the filters to narrow the period."
        actions={
          <button
            type="button"
            onClick={() => downloadExcel("ibanga-analytics", ["Measure", "Value"], kpiRows(kpis))}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Export Excel
          </button>
        }
      />
      <div className="mt-6"><SimulationNotice kind="general" /></div>

      <div className="mt-5 grid gap-3 rounded-2xl border border-line bg-card p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-medium text-navy">
          From
          <input type="date" className={`${controlClass} mt-1`} value={filters.from} max={filters.to || undefined} onChange={(event) => set({ from: event.target.value })} />
        </label>
        <label className="text-sm font-medium text-navy">
          To
          <input type="date" className={`${controlClass} mt-1`} value={filters.to} min={filters.from || undefined} onChange={(event) => set({ to: event.target.value })} />
        </label>
        <label className="text-sm font-medium text-navy">
          Shipment status
          <select className={`${controlClass} mt-1`} value={filters.shipmentStatus} onChange={(event) => set({ shipmentStatus: event.target.value as ShipmentStatus | "" })}>
            <option value="">All shipment statuses</option>
            {statusOptions("shipment").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <div className="flex items-end">
          <button type="button" disabled={!filtered} onClick={() => setFilters({ from: "", to: "", shipmentStatus: "" })} className="w-full rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-50">
            Clear filters
          </button>
        </div>
      </div>
      {invalidRange ? <p role="alert" className="mt-2 text-sm font-medium text-bad">The start date is after the end date, so no records match.</p> : null}
      <p className="mt-2 text-xs text-muted">Dates filter each record by its own creation, payment or filing date. The shipment status filter affects shipment figures and charts only. Trucks, verifications and document alerts are current counts.</p>

      <StatGrid>
        <StatCard label="Registered users" value={kpis.registeredUsers} hint="Importers and owners" />
        <StatCard label="Pending verifications" value={kpis.pendingVerifications} hint="Awaiting review" accent="warn" href="/dashboard/admin/verifications" />
        <StatCard label="Active trucks" value={kpis.activeTrucks} hint="Verified and in service" accent="good" href="/dashboard/admin/trucks" />
        <StatCard label="Active shipments" value={kpis.activeShipments} hint="Scheduled to unloading" accent="accent" href="/dashboard/admin/shipments" />
        <StatCard label="Completed shipments" value={kpis.completedShipments} hint="Delivered or completed" accent="good" />
        <StatCard label="Cancelled shipments" value={kpis.cancelledShipments} hint="In this period" />
        <StatCard label="Payment volume" value={formatRwf(kpis.paymentVolumeRwf)} hint="Simulated payments" accent="accent" href="/dashboard/admin/payments" />
        <StatCard label="Platform revenue" value={formatRwf(kpis.platformRevenueRwf)} hint="Commission on released payments" accent="good" />
        <StatCard label="Pending settlements" value={kpis.pendingSettlementsCount} hint={`${formatRwf(kpis.pendingSettlementsRwf)} net owed`} accent="warn" href="/dashboard/admin/settlements" />
        <StatCard label="Refund volume" value={formatRwf(kpis.refundVolumeRwf)} hint="Approved refunds" href="/dashboard/admin/refunds" />
        <StatCard label="Open disputes" value={kpis.openDisputes} hint="Not yet closed" accent="bad" href="/dashboard/admin/disputes" />
        <StatCard label="Accidents" value={kpis.accidents} hint={`${kpis.insuranceClaims} insurance claims`} accent="bad" href="/dashboard/admin/incidents" />
        <StatCard label="Document alerts" value={kpis.documentAlerts} hint="Expired or expiring" accent="warn" href="/dashboard/admin/document-expiry" />
        <StatCard label="Failed payouts" value={kpis.failedPayouts} hint="Simulated payouts" accent="bad" href="/dashboard/admin/settlements" />
        <StatCard label="Reconciliation issues" value={kpis.reconciliationDiscrepancies} hint="Discrepancy, unmatched or duplicate" accent="bad" href="/dashboard/admin/reconciliation" />
        <StatCard label="Insurance claims" value={kpis.insuranceClaims} hint="Filed in this period" href="/dashboard/admin/insurance-claims" />
      </StatGrid>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <LineChartCard
          title="Payment volume"
          caption="Simulated payments by month, last 6 months"
          badge={formatRwfCompact(kpis.paymentVolumeRwf)}
          unit="RWF"
          points={bucketByMonth(data.paidBookings, (booking) => booking.payment?.paidAt, (booking) => booking.payment?.amountRwf ?? 0)}
        />
        <BarChartCard
          title="Platform revenue"
          caption="Commission on released payments by month"
          points={bucketByMonth(data.paidBookings.filter((booking) => booking.payment?.status === "RELEASED"), (booking) => booking.payment?.paidAt, (booking) => booking.payment?.commissionRwf ?? 0)}
          format={formatRwfCompact}
          empty="No released payments in this period yet."
        />
        <BarChartCard
          title="Shipments created"
          caption="Shipments by month, last 6 months"
          points={bucketByMonth(data.shipments, (shipment) => shipment.createdAt)}
          format={(value) => String(value)}
          empty="No shipments in this period."
        />
        <DonutCard
          title="Shipments by status"
          caption="Share of shipments in the selected period"
          centerLabel="shipments"
          slices={shipmentStatusMix({ ...input }, filters).map((item, index) => ({ label: LABELS[item.key] ?? item.key, count: item.count, color: COLORS[index % COLORS.length] }))}
          empty="No shipments in this period."
        />
        <DonutCard
          title="Disputes by status"
          caption="Cases opened in the selected period"
          centerLabel="disputes"
          slices={disputeStatusMix(input, filters).map((item, index) => ({ label: LABELS[item.key] ?? item.key, count: item.count, color: COLORS[index % COLORS.length] }))}
          empty="No disputes in this period."
        />
        <BarChartCard
          title="Incidents reported"
          caption="Accidents, breakdowns and damage by month"
          points={bucketByMonth(data.incidents, (incident) => incident.createdAt)}
          format={(value) => String(value)}
          empty="No incidents in this period."
        />
      </div>
    </>
  );
}
