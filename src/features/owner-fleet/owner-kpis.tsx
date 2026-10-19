"use client";

import Link from "next/link";
import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { controlClass } from "@/components/common/form-fields";
import { DemoTag, SimulationNotice } from "@/components/common/notices";
import { StatCard } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatPercent, formatRwf, pluralize } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { Settlement, SettlementStatus, Shipment } from "@/types/ops";

type StatusFilter = "ALL" | "PENDING" | "PAID" | "FAILED";

const PENDING: SettlementStatus[] = ["AWAITING_DELIVERY", "AWAITING_VERIFICATION", "ON_HOLD", "ELIGIBLE", "PROCESSING"];
const sum = (items: Settlement[], pick: (item: Settlement) => number) => items.reduce((total, item) => total + pick(item), 0);
const inRange = (value: string | undefined, from: string, to: string) => {
  if (!value) return false;
  const day = value.slice(0, 10);
  return (!from || day >= from) && (!to || day <= to);
};

/** Owner KPI cards. Date range filters every dated figure; the status filter narrows the money figures. */
export function OwnerKpis() {
  const actor = useActor();
  const settlements = useServiceQuery(() => services.settlements.list(actor!, { pageSize: 200 }), [actor?.id]);
  const shipments = useServiceQuery(() => services.shipments.list(actor!, { pageSize: 200 }), [actor?.id]);
  const query = {
    data: settlements.data && shipments.data ? { settlements: settlements.data.items, shipments: shipments.data.items } : undefined,
    loading: settlements.loading || shipments.loading,
    error: settlements.error ?? shipments.error,
    refetch: () => {
      settlements.refetch();
      shipments.refetch();
    },
  };

  return (
    <section className="mt-8" aria-labelledby="ops-overview">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="ops-overview" className="font-display text-xl tracking-tight text-navy">Operations overview</h2>
        <DemoTag />
      </div>
      <p className="mt-1 text-sm text-muted">Fleet, work and settlement figures for your account only.</p>
      <div className="mt-4">
        <QueryBoundary query={query}>{(data) => <Kpis settlements={data.settlements} shipments={data.shipments} />}</QueryBoundary>
      </div>
    </section>
  );
}

function Kpis({ settlements, shipments }: { settlements: Settlement[]; shipments: Shipment[] }) {
  const actor = useActor();
  const ops = useOps();
  const { trucks } = useIbanga();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");

  const myTrucks = trucks.filter((truck) => truck.ownerId === actor?.id);
  const profiles = ops.truckProfiles.filter((profile) => myTrucks.some((truck) => truck.id === profile.truckId));

  const dated = settlements.filter((item) => (!from && !to) || inRange(item.createdAt, from, to));
  const filtered = dated.filter((item) =>
    status === "ALL" ? true : status === "PENDING" ? PENDING.includes(item.status) : item.status === status,
  );
  const counted = filtered.filter((item) => item.status !== "NOT_ELIGIBLE");
  const pending = filtered.filter((item) => PENDING.includes(item.status));
  const paid = filtered.filter((item) => item.status === "PAID");
  const failed = filtered.filter((item) => item.status === "FAILED");

  const completed = shipments.filter((item) => ["DELIVERED", "COMPLETED"].includes(item.status) && ((!from && !to) || inRange(item.createdAt, from, to)));
  const available = profiles.filter((profile) => profile.opsStatus === "AVAILABLE").length;
  const utilisation = profiles.length ? profiles.reduce((total, profile) => total + profile.utilizationPct, 0) / profiles.length : 0;
  const filtering = Boolean(from || to || status !== "ALL");

  return (
    <>
      <div className="grid gap-3 rounded-2xl border border-line bg-card p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm font-medium text-navy">
          From
          <input className={`${controlClass} mt-1.5`} type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-navy">
          To
          <input className={`${controlClass} mt-1.5`} type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-navy">
          Settlement status
          <select className={`${controlClass} mt-1.5`} value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending (not yet paid)</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed payouts</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            disabled={!filtering}
            onClick={() => {
              setFrom("");
              setTo("");
              setStatus("ALL");
            }}
            className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-brand/40 disabled:opacity-50"
          >
            Clear filters
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">
        Dates filter settlement and shipment figures. Settlement status narrows payment figures. Fleet size and utilisation are current figures.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total trucks" value={myTrucks.length} hint="In your fleet" href="/dashboard/owner/trucks" />
        <StatCard label="Available trucks" value={available} hint="Ready for new work" accent="good" href="/dashboard/owner/trucks" />
        <StatCard label="Completed trips" value={completed.length} hint="Delivered or completed" accent="brand" href="/dashboard/owner/history" />
        <StatCard label="Gross earnings" value={formatRwf(sum(counted, (item) => item.agreedAmountRwf))} hint={`${pluralize(counted.length, "settlement")}, before fees`} accent="good" href="/dashboard/owner/earnings" />
        <StatCard label="Platform fees" value={formatRwf(sum(counted, (item) => item.platformFeeRwf))} hint="Commission deducted" accent="warn" href="/dashboard/owner/earnings" />
        <StatCard label="Pending settlements" value={formatRwf(sum(pending, (item) => item.netAmountRwf))} hint={`${pluralize(pending.length, "settlement")} not yet paid`} accent="warn" href="/dashboard/owner/earnings" />
        <StatCard label="Paid settlements" value={formatRwf(sum(paid, (item) => item.netAmountRwf))} hint={`${pluralize(paid.length, "settlement")} paid`} accent="good" href="/dashboard/owner/payouts" />
        <StatCard label="Failed payouts" value={failed.length} hint={failed.length ? `${formatRwf(sum(failed, (item) => item.netAmountRwf))} to retry via admin` : "None failed"} accent={failed.length ? "bad" : "good"} href="/dashboard/owner/payouts" />
        <StatCard label="Truck utilisation" value={profiles.length ? formatPercent(utilisation) : "No data"} hint="Average, last 30 days" accent="accent" href="/dashboard/owner/trucks" />
      </div>
      <div className="mt-4 space-y-3">
        <SimulationNotice kind="settlement" />
        <p className="text-sm text-muted">
          Looking for work? <Link href="/dashboard/owner/opportunities" className="font-semibold text-brand hover:text-brand-dark">Browse cargo opportunities</Link>.
        </p>
      </div>
    </>
  );
}
