"use client";

import { QueryBoundary } from "@/components/common/async-state";
import { StatGrid } from "@/components/common/layout-blocks";
import { Notice, SimulationNotice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, StatCard, ViewLink } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate, formatRwf } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import { useEligibility } from "./use-eligibility";

const SETTLED = ["PAID", "FAILED", "REVERSED", "NOT_ELIGIBLE"];

export function SettlementList() {
  const actor = useActor();
  const { bookings } = useIbanga();
  const eligibility = useEligibility();
  const query = useServiceQuery(() => services.settlements.list(actor!, { pageSize: 500 }), [actor?.id]);

  return (
    <div className="mt-6 space-y-5">
      <SimulationNotice kind="settlement" />
      <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0} empty={{ title: "No settlements yet", text: "A settlement is created for each paid booking. It is released after delivery is verified." }}>
        {(data) => {
          const items = data.items;
          const sum = (pick: (status: string) => boolean, field: "agreedAmountRwf" | "platformFeeRwf" | "netAmountRwf") =>
            items.filter((item) => pick(item.status)).reduce((total, item) => total + item[field], 0);
          const all = () => true;
          return (
            <>
              <StatGrid>
                <StatCard label="Gross agreed" value={formatRwf(sum(all, "agreedAmountRwf"))} hint="Before fees" />
                <StatCard label="Platform fees" value={formatRwf(sum(all, "platformFeeRwf"))} hint="Commission" accent="warn" />
                <StatCard label="Net earnings" value={formatRwf(sum(all, "netAmountRwf"))} hint="After fees and adjustments" accent="accent" />
                <StatCard label="Pending" value={formatRwf(sum((s) => !SETTLED.includes(s), "netAmountRwf"))} hint="Not yet paid out" accent="warn" />
                <StatCard label="Paid" value={formatRwf(sum((s) => s === "PAID", "netAmountRwf"))} hint="Paid out" accent="good" />
                <StatCard label="Failed" value={formatRwf(sum((s) => s === "FAILED", "netAmountRwf"))} hint="Needs attention" accent="bad" />
              </StatGrid>
              {items.some((item) => item.status === "FAILED") ? (
                <Notice tone="danger" title="A payout failed">Check your payout details, then contact support. Administrators retry failed payouts. See Payout history for the reason.</Notice>
              ) : null}
              <DataTable
                columns={[{ label: "Settlement" }, { label: "Route" }, { label: "Agreed" }, { label: "Net payable" }, { label: "Status" }, { label: "Why" }, { label: "Created" }, { label: "Actions", className: "text-right" }]}
                emptyMessage="No settlements match."
                filterLabel="All settlement statuses"
                exportName="ibanga-owner-settlements"
                rows={items.map((settlement) => {
                  const booking = bookings.find((item) => item.id === settlement.bookingId);
                  const route = booking ? `${booking.pickupLocation} to ${booking.destination}` : "Route unavailable";
                  const evaluation = eligibility(settlement);
                  const why =
                    settlement.status === "FAILED" ? (settlement.failureReason ?? "Payout failed.")
                    : settlement.status === "PAID" ? "Paid out."
                    : settlement.status === "PROCESSING" ? "Payout is processing."
                    : settlement.holdReason ?? evaluation?.reasons[0] ?? "—";
                  return {
                    id: settlement.id,
                    searchText: `${settlement.ref} ${route} ${settlement.status} ${why}`,
                    filterValue: settlement.status,
                    exportValues: [settlement.ref, route, String(settlement.agreedAmountRwf), String(settlement.netAmountRwf), settlement.status, why, formatDate(settlement.createdAt), ""],
                    cells: [
                      <strong key="ref">{settlement.ref}</strong>,
                      <span key="route" className="block min-w-40">{route}</span>,
                      formatRwf(settlement.agreedAmountRwf),
                      <strong key="net">{formatRwf(settlement.netAmountRwf)}</strong>,
                      <StatusBadge key="st" family="settlement" status={settlement.status} />,
                      <span key="why" className="block max-w-xs whitespace-normal text-sm text-muted">{why}</span>,
                      formatDate(settlement.createdAt),
                      <div key="a" className="flex justify-end"><ViewLink href={`/dashboard/owner/earnings/${settlement.id}`} label={`Open settlement ${settlement.ref}`} /></div>,
                    ],
                  };
                })}
              />
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
