"use client";

import Link from "next/link";
import { RoleShell } from "@/components/common/role-shell";
import { QueryBoundary } from "@/components/common/async-state";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, PageHeader, StatCard, ViewLink } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDateTime } from "@/lib/format";
import { services } from "@/services";
import { CATEGORY_LABELS } from "./schemas";
import { portalBase, type PortalRole } from "./portal";

export function TicketList({ role }: { role: PortalRole }) {
  const actor = useActor();
  const base = portalBase(role);
  const query = useServiceQuery(() => services.support.list(actor!, { pageSize: 200 }), [actor?.id]);
  const newTicket = (
    <Link href={`${base}/support/new`} className="inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
      New ticket
    </Link>
  );

  return (
    <RoleShell role={role}>
      <PageHeader eyebrow="Help" title="Support tickets" subtitle="Ask the iBanga team about a booking, payment, shipment or your account." actions={newTicket} />
      <QueryBoundary
        query={query}
        isEmpty={(data) => data.items.length === 0}
        empty={{ title: "No support tickets", text: "When you need help, open a ticket and the team will reply here.", action: newTicket }}
      >
        {(data) => {
          const count = (statuses: string[]) => data.items.filter((ticket) => statuses.includes(ticket.status)).length;
          return (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <StatCard label="Open" value={count(["OPEN", "IN_PROGRESS"])} hint="Being handled" accent="warn" />
                <StatCard label="Waiting for you" value={count(["AWAITING_CUSTOMER"])} hint="Support asked something" accent={count(["AWAITING_CUSTOMER"]) ? "bad" : "good"} />
                <StatCard label="Resolved or closed" value={count(["RESOLVED", "CLOSED"])} hint="Finished" accent="good" />
              </div>
              <div className="mt-5">
                <DataTable
                  exportName="ibanga-support-tickets"
                  filterLabel="All statuses"
                  extraFilterLabel="All categories"
                  emptyMessage="No tickets match your search."
                  columns={[{ label: "Ticket" }, { label: "Category" }, { label: "Priority" }, { label: "Updated" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
                  rows={data.items.map((ticket) => ({
                    id: ticket.id,
                    searchText: `${ticket.ref} ${ticket.subject} ${ticket.relatedRef ?? ""} ${ticket.category} ${ticket.status}`,
                    filterValue: ticket.status,
                    extraFilterValue: ticket.category,
                    exportValues: [ticket.ref, ticket.subject, CATEGORY_LABELS[ticket.category], ticket.priority, formatDateTime(ticket.updatedAt), ticket.status, ""],
                    cells: [
                      <span key="t" className="block min-w-48">
                        <strong className="block">{ticket.subject}</strong>
                        <span className="text-xs text-muted">{ticket.ref}{ticket.relatedRef ? ` · ${ticket.relatedRef}` : ""}</span>
                      </span>,
                      CATEGORY_LABELS[ticket.category],
                      <StatusBadge key="p" family="ticketPriority" status={ticket.priority} />,
                      formatDateTime(ticket.updatedAt),
                      <StatusBadge key="s" family="ticket" status={ticket.status} />,
                      <div key="a" className="flex justify-end"><ViewLink href={`${base}/support/${ticket.id}`} label={`Open ticket ${ticket.ref}`} /></div>,
                    ],
                  }))}
                />
              </div>
            </>
          );
        }}
      </QueryBoundary>
    </RoleShell>
  );
}
