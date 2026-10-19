"use client";

import { Notice, SimulationNotice } from "@/components/common/notices";
import { StatGrid } from "@/components/common/layout-blocks";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, EmptyState, StatCard, ViewLink } from "@/components/ui";
import { formatDate, formatRwf } from "@/lib/format";
import { useIbanga } from "@/lib/store";

export const SOURCE_LABEL = { REFUND: "Refund request", CANCELLATION: "Cancellation", DISPUTE: "Dispute decision", INCIDENT: "Incident" } as const;

const PAYOUT_LABEL = { PENDING: "Refund pending", COMPLETED: "Refund sent (simulated)", FAILED: "Refund failed" } as const;

export function RefundsOverview() {
  const { refunds, users, bookings } = useIbanga();
  const nameOf = (id: string) => users.find((user) => user.id === id)?.name ?? "Unknown user";
  const sorted = [...refunds].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pending = refunds.filter((item) => item.status === "REQUESTED");
  const approved = refunds.filter((item) => item.status === "APPROVED");
  const failed = refunds.filter((item) => item.payoutState === "FAILED");
  const total = (items: typeof refunds) => items.reduce((sum, item) => sum + item.amountRwf, 0);

  return (
    <div className="mt-6 space-y-5">
      <SimulationNotice kind="payment" />
      <Notice tone="info" title="Backend requirement">
        Refund approval and the refund payout must be idempotent and transactional on the server. Approving here only changes demonstration data.
      </Notice>
      {failed.length ? (
        <Notice tone="danger" title={`${failed.length} refund(s) failed`}>
          Open a failed refund to see the reason. Failed refunds are simulated outcomes.
        </Notice>
      ) : null}
      {refunds.length === 0 ? (
        <EmptyState title="No refund requests" text="Importers have not requested any refunds yet." />
      ) : (
        <>
          <StatGrid>
            <StatCard label="Awaiting review" value={pending.length} hint={formatRwf(total(pending))} accent="warn" />
            <StatCard label="Approved" value={approved.length} hint={formatRwf(total(approved))} accent="good" />
            <StatCard label="Rejected" value={refunds.filter((item) => item.status === "REJECTED").length} accent="brand" />
            <StatCard label="Failed refunds" value={failed.length} hint={formatRwf(total(failed))} accent="bad" />
          </StatGrid>
          <DataTable
            columns={[{ label: "Reference" }, { label: "Importer" }, { label: "Booking" }, { label: "Amount" }, { label: "Origin" }, { label: "Status" }, { label: "Refund result" }, { label: "Requested" }, { label: "Open" }]}
            rows={sorted.map((item) => {
              const origin = SOURCE_LABEL[item.source ?? "REFUND"];
              const reference = item.ref ?? item.id;
              const hasBooking = bookings.some((booking) => booking.id === item.bookingId);
              return {
                id: item.id,
                cells: [
                  <span key="r" className="font-semibold">{reference}</span>,
                  nameOf(item.importerId),
                  <span key="b" className="font-mono text-xs">{item.bookingId}{hasBooking ? "" : " (missing)"}</span>,
                  <span key="a" className="font-semibold tabular-nums">{formatRwf(item.amountRwf)}</span>,
                  origin,
                  <StatusBadge key="s" family="refund" status={item.status} />,
                  item.payoutState ? PAYOUT_LABEL[item.payoutState] : "—",
                  formatDate(item.createdAt),
                  <ViewLink key="v" href={`/dashboard/admin/refunds/${item.id}`} label={`Open refund ${reference}`} />,
                ],
                searchText: `${reference} ${item.bookingId} ${nameOf(item.importerId)} ${item.reason} ${origin}`,
                filterValue: item.status,
                extraFilterValue: origin,
                exportValues: [reference, nameOf(item.importerId), item.bookingId, String(item.amountRwf), origin, item.status, item.payoutState ?? "", item.createdAt],
              };
            })}
            filterLabel="All statuses"
            extraFilterLabel="All origins"
            exportName="refunds-demo"
            emptyMessage="No refunds match these filters."
          />
        </>
      )}
    </div>
  );
}
