"use client";

import Link from "next/link";
import { QueryBoundary } from "@/components/common/async-state";
import { Notice } from "@/components/common/notices";
import { RoleShell } from "@/components/common/role-shell";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, PageHeader, StatCard, ViewLink } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDateTime } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import { portalBase, type PortalRole } from "@/features/support/portal";
import { DISPUTE_CATEGORY_LABELS } from "./schemas";

export function DisputeList({ role }: { role: PortalRole }) {
  const actor = useActor();
  const { users } = useIbanga();
  const base = portalBase(role);
  const query = useServiceQuery(() => services.disputes.list(actor!, { pageSize: 200 }), [actor?.id]);
  const newDispute = (
    <Link href={`${base}/disputes/new`} className="inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
      Open a dispute
    </Link>
  );

  return (
    <RoleShell role={role}>
      <PageHeader eyebrow="Resolution" title="Disputes" subtitle="Problems with a booking or delivery that need an administrator to review." actions={newDispute} />
      <div className="mt-5">
        <Notice tone="warning" title="A dispute holds the settlement">
          Opening a dispute places a hold on the truck owner&apos;s settlement for that booking until the case is resolved. Nothing is refunded or paid out by opening one.
        </Notice>
      </div>
      <QueryBoundary
        query={query}
        isEmpty={(data) => data.items.length === 0}
        empty={{ title: "No disputes", text: "You have no dispute cases. Open one from a booking if something went wrong.", action: newDispute }}
      >
        {(data) => {
          const open = data.items.filter((item) => !["RESOLVED", "REJECTED"].includes(item.status)).length;
          const needsInfo = data.items.filter((item) => item.status === "AWAITING_INFO").length;
          return (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <StatCard label="Active cases" value={open} hint="Not yet resolved" accent="warn" />
                <StatCard label="Information requested" value={needsInfo} hint={needsInfo ? "Needs your answer" : "Nothing waiting"} accent={needsInfo ? "bad" : "good"} />
                <StatCard label="Closed" value={data.items.length - open} hint="Resolved or rejected" accent="good" />
              </div>
              <div className="mt-5">
                <DataTable
                  exportName="ibanga-disputes"
                  filterLabel="All statuses"
                  extraFilterLabel="All categories"
                  emptyMessage="No disputes match your search."
                  columns={[{ label: "Case" }, { label: "Category" }, { label: "Raised by" }, { label: "Updated" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
                  rows={data.items.map((item) => {
                    const raisedBy = item.raisedBy === actor?.id ? "You" : (users.find((user) => user.id === item.raisedBy)?.name ?? "Other party");
                    return {
                      id: item.id,
                      searchText: `${item.ref} ${item.bookingId} ${DISPUTE_CATEGORY_LABELS[item.category]} ${item.description} ${item.status}`,
                      filterValue: item.status,
                      extraFilterValue: item.category,
                      exportValues: [item.ref, item.bookingId, DISPUTE_CATEGORY_LABELS[item.category], raisedBy, formatDateTime(item.updatedAt), item.status, ""],
                      cells: [
                        <span key="c" className="block min-w-44">
                          <strong className="block">{item.ref}</strong>
                          <span className="text-xs text-muted">Booking {item.bookingId}</span>
                        </span>,
                        DISPUTE_CATEGORY_LABELS[item.category],
                        raisedBy,
                        formatDateTime(item.updatedAt),
                        <StatusBadge key="s" family="dispute" status={item.status} />,
                        <div key="a" className="flex justify-end"><ViewLink href={`${base}/disputes/${item.id}`} label={`Open dispute ${item.ref}`} /></div>,
                      ],
                    };
                  })}
                />
              </div>
            </>
          );
        }}
      </QueryBoundary>
    </RoleShell>
  );
}
