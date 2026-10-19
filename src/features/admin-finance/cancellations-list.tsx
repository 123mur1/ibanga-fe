"use client";

import { QueryBoundary } from "@/components/common/async-state";
import { StatGrid } from "@/components/common/layout-blocks";
import { Notice, SimulationNotice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { CANCELLATION_POLICY } from "@/config/business-rules";
import { DataTable, StatCard, ViewLink } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate, formatRwf } from "@/lib/format";
import { services } from "@/services";
import { useUserName } from "./finance-parts";

export const stageLabel = (stage: string) => CANCELLATION_POLICY.find((row) => row.stage === stage)?.label ?? stage;

export function CancellationsOverview() {
  const actor = useActor();
  const nameOf = useUserName();
  const query = useServiceQuery(() => services.cancellations.list(actor!, { pageSize: 500 }), [actor?.id]);

  return (
    <div className="mt-6 space-y-5">
      <SimulationNotice kind="payment" />
      <Notice tone="info" title="Policy outcome is shown, not decided here">
        Fee and refundable amount come from the cancellation policy for the stage the booking had reached. The backend must calculate and enforce them.
      </Notice>
      <QueryBoundary
        query={query}
        isEmpty={(data) => data.items.length === 0}
        empty={{ title: "No cancellation requests", text: "Nobody has asked to cancel a booking yet." }}
      >
        {(data) => {
          const open = data.items.filter((item) => item.status === "REQUESTED");
          const approved = data.items.filter((item) => item.status === "APPROVED");
          const refundTotal = data.items.filter((item) => item.status !== "REJECTED").reduce((sum, item) => sum + item.refundRwf, 0);
          return (
            <>
              <StatGrid>
                <StatCard label="Awaiting review" value={open.length} accent="warn" />
                <StatCard label="Approved, not completed" value={approved.length} hint="Refund still to be recorded" accent="brand" />
                <StatCard label="Completed" value={data.items.filter((item) => item.status === "COMPLETED").length} accent="good" />
                <StatCard label="Refundable (simulated)" value={formatRwf(refundTotal)} hint="Excludes rejected" accent="accent" />
              </StatGrid>
              <DataTable
                columns={[{ label: "Reference" }, { label: "Requested by" }, { label: "Booking" }, { label: "Stage" }, { label: "Fee" }, { label: "Refundable" }, { label: "Status" }, { label: "Requested" }, { label: "Open" }]}
                rows={data.items.map((item) => ({
                  id: item.id,
                  cells: [
                    <span key="r" className="font-semibold">{item.ref}</span>,
                    nameOf(item.requestedBy),
                    <span key="b" className="font-mono text-xs">{item.bookingId}</span>,
                    stageLabel(item.stage),
                    formatRwf(item.feeRwf),
                    <span key="f" className="font-semibold tabular-nums">{formatRwf(item.refundRwf)}</span>,
                    <StatusBadge key="s" family="cancellation" status={item.status} />,
                    formatDate(item.createdAt),
                    <ViewLink key="v" href={`/dashboard/admin/cancellations/${item.id}`} label={`Open cancellation ${item.ref}`} />,
                  ],
                  searchText: `${item.ref} ${item.bookingId} ${nameOf(item.requestedBy)} ${item.reason} ${stageLabel(item.stage)}`,
                  filterValue: item.status,
                  extraFilterValue: stageLabel(item.stage),
                  exportValues: [item.ref, nameOf(item.requestedBy), item.bookingId, item.stage, String(item.paidAmountRwf), String(item.feeRwf), String(item.refundRwf), item.status, item.createdAt],
                }))}
                filterLabel="All statuses"
                extraFilterLabel="All stages"
                exportName="cancellations-demo"
                emptyMessage="No cancellations match these filters."
              />
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
