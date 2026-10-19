"use client";

import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { SimulationNotice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { StatGrid } from "@/components/common/layout-blocks";
import { Tabs } from "@/components/common/tabs";
import { DataTable, StatCard, ViewLink, type DataTableRow } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate, formatRwf } from "@/lib/format";
import { services } from "@/services";
import type { Payout, Settlement } from "@/types/ops";
import { useUserName } from "./finance-parts";

const BASE = "/dashboard/admin/settlements";

function settlementRows(items: Settlement[], nameOf: (id: string) => string): DataTableRow[] {
  return items.map((item) => ({
    id: item.id,
    cells: [
      <span key="ref" className="font-semibold">{item.ref}</span>,
      nameOf(item.ownerId),
      <span key="b" className="font-mono text-xs">{item.bookingId}</span>,
      formatRwf(item.agreedAmountRwf),
      <span key="n" className="font-semibold tabular-nums">{formatRwf(item.netAmountRwf)}</span>,
      <StatusBadge key="s" family="settlement" status={item.status} />,
      formatDate(item.createdAt),
      <ViewLink key="v" href={`${BASE}/${item.id}`} label={`Open settlement ${item.ref}`} />,
    ],
    searchText: `${item.ref} ${item.bookingId} ${nameOf(item.ownerId)} ${item.payoutRef ?? ""} ${item.status}`,
    filterValue: item.status,
    extraFilterValue: nameOf(item.ownerId),
    exportValues: [item.ref, nameOf(item.ownerId), item.bookingId, String(item.agreedAmountRwf), String(item.platformFeeRwf), String(item.netAmountRwf), item.status, item.createdAt],
  }));
}

function payoutRows(items: Payout[], nameOf: (id: string) => string): DataTableRow[] {
  return items.map((item) => ({
    id: item.id,
    cells: [
      <span key="ref" className="font-semibold">{item.ref}</span>,
      nameOf(item.ownerId),
      formatRwf(item.amountRwf),
      item.method === "BANK" ? "Bank" : "Mobile money",
      <span key="d" className="text-sm">{item.destination}</span>,
      <span key="s">
        <StatusBadge family="payout" status={item.status} />
        {item.failureReason ? <span className="mt-1 block text-xs text-bad">{item.failureReason}</span> : null}
      </span>,
      formatDate(item.createdAt),
      <span key="l" className="text-xs">{item.settlementIds.length} settlement(s)</span>,
    ],
    searchText: `${item.ref} ${nameOf(item.ownerId)} ${item.destination} ${item.status}`,
    filterValue: item.status,
    extraFilterValue: nameOf(item.ownerId),
    exportValues: [item.ref, nameOf(item.ownerId), String(item.amountRwf), item.method, item.destination, item.status, item.failureReason ?? "", item.createdAt],
  }));
}

export function SettlementsOverview() {
  const actor = useActor();
  const nameOf = useUserName();
  const [tab, setTab] = useState<"settlements" | "payouts">("settlements");
  const settlements = useServiceQuery(() => services.settlements.list(actor!, { pageSize: 500 }), [actor?.id]);
  const payouts = useServiceQuery(() => services.settlements.listPayouts(actor!, { pageSize: 500 }), [actor?.id]);

  return (
    <div className="mt-6 space-y-5">
      <SimulationNotice kind="settlement" />
      <QueryBoundary
        query={settlements}
        isEmpty={(data) => data.items.length === 0 && tab === "settlements"}
        empty={{ title: "No settlements yet", text: "A settlement is created when a booking moves forward. None exist in the demonstration data." }}
      >
        {(data) => {
          const sum = (status: Settlement["status"][]) => data.items.filter((item) => status.includes(item.status)).reduce((total, item) => total + item.netAmountRwf, 0);
          const count = (status: Settlement["status"][]) => data.items.filter((item) => status.includes(item.status)).length;
          return (
            <>
              <StatGrid>
                <StatCard label="Ready to approve" value={formatRwf(sum(["ELIGIBLE"]))} hint={`${count(["ELIGIBLE"])} eligible`} accent="brand" />
                <StatCard label="Waiting or on hold" value={formatRwf(sum(["AWAITING_DELIVERY", "AWAITING_VERIFICATION", "ON_HOLD"]))} hint={`${count(["AWAITING_DELIVERY", "AWAITING_VERIFICATION", "ON_HOLD"])} settlements`} accent="warn" />
                <StatCard label="Paid (simulated)" value={formatRwf(sum(["PAID"]))} hint={`${count(["PAID"])} paid`} accent="good" />
                <StatCard label="Failed payouts" value={count(["FAILED"])} hint={formatRwf(sum(["FAILED"]))} accent="bad" />
              </StatGrid>
              <Tabs
                label="Settlements and payouts"
                value={tab}
                onChange={setTab}
                tabs={[
                  { key: "settlements", label: "Settlements", count: data.total },
                  { key: "payouts", label: "Payouts", count: payouts.data?.total },
                ]}
              />
              {tab === "settlements" ? (
                <DataTable
                  columns={[{ label: "Reference" }, { label: "Truck owner" }, { label: "Booking" }, { label: "Agreed" }, { label: "Net payout" }, { label: "Status" }, { label: "Created" }, { label: "Open" }]}
                  rows={settlementRows(data.items, nameOf)}
                  filterLabel="All statuses"
                  extraFilterLabel="All owners"
                  exportName="settlements-demo"
                  emptyMessage="No settlements match these filters."
                />
              ) : (
                <QueryBoundary query={payouts} isEmpty={(result) => result.items.length === 0} empty={{ title: "No payouts yet", text: "A payout is created when an administrator approves an eligible settlement." }}>
                  {(result) => (
                    <DataTable
                      columns={[{ label: "Reference" }, { label: "Truck owner" }, { label: "Amount" }, { label: "Method" }, { label: "Destination" }, { label: "Status" }, { label: "Created" }, { label: "Covers" }]}
                      rows={payoutRows(result.items, nameOf)}
                      filterLabel="All statuses"
                      extraFilterLabel="All owners"
                      exportName="payouts-demo"
                      emptyMessage="No payouts match these filters."
                    />
                  )}
                </QueryBoundary>
              )}
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
