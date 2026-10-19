"use client";

import Link from "next/link";
import { QueryBoundary } from "@/components/common/async-state";
import { Notice, SimulationNotice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate, formatRwf, titleCase } from "@/lib/format";
import { services } from "@/services";

export function PayoutList() {
  const actor = useActor();
  const query = useServiceQuery(() => services.settlements.listPayouts(actor!, { pageSize: 500 }), [actor?.id]);
  return (
    <div className="space-y-5">
      <SimulationNotice kind="settlement" />
      <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0} empty={{ title: "No payouts yet", text: "Payouts appear after an administrator approves an eligible settlement." }}>
        {(data) => (
          <>
            {data.items.some((item) => item.status === "FAILED") ? (
              <Notice tone="danger" title="What to do about a failed payout">
                Check that your payout destination (mobile money number or bank account) is correct on your profile. Administrators retry failed payouts; you cannot retry one yourself.{" "}
                <Link href="/dashboard/owner/support/new" className="font-semibold underline">Contact support</Link> if it keeps failing.
              </Notice>
            ) : null}
            <DataTable
              columns={[{ label: "Payout" }, { label: "Amount" }, { label: "Method" }, { label: "Destination" }, { label: "Status" }, { label: "Details" }, { label: "Created" }]}
              emptyMessage="No payouts match."
              filterLabel="All payout statuses"
              exportName="ibanga-owner-payouts"
              rows={data.items.map((payout) => {
                const detail = payout.status === "FAILED" ? (payout.failureReason ?? "Failed, no reason recorded.") : payout.status === "PAID" ? `Paid ${formatDate(payout.paidAt)}` : "Processing";
                return {
                  id: payout.id,
                  searchText: `${payout.ref} ${payout.destination} ${payout.status}`,
                  filterValue: payout.status,
                  exportValues: [payout.ref, String(payout.amountRwf), payout.method, payout.destination, payout.status, detail, formatDate(payout.createdAt)],
                  cells: [
                    <strong key="r">{payout.ref}</strong>,
                    <strong key="a">{formatRwf(payout.amountRwf)}</strong>,
                    titleCase(payout.method),
                    payout.destination,
                    <StatusBadge key="s" family="payout" status={payout.status} />,
                    <span key="d" className="block max-w-xs whitespace-normal text-sm text-muted">{detail}</span>,
                    formatDate(payout.createdAt),
                  ],
                };
              })}
            />
          </>
        )}
      </QueryBoundary>
    </div>
  );
}
