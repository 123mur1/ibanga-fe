"use client";

import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { controlClass } from "@/components/common/form-fields";
import { StatusBadge, statusOptions } from "@/components/common/status-badge";
import { DataTable, PageHeader, StatCard, ViewLink } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate } from "@/lib/format";
import { services } from "@/services";
import { useUserNames } from "../admin-platform/admin-page";
import { optionList, ROLE_LABEL, TICKET_CATEGORIES } from "./constants";

export function TicketQueue() {
  const actor = useActor();
  const name = useUserNames();
  const { adminProfiles } = useOps();
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [assignee, setAssignee] = useState("");

  const query = useServiceQuery(
    () => services.support.list(actor!, { pageSize: 500, filters: { status, priority, category, assignedTo: assignee && assignee !== "UNASSIGNED" ? assignee : undefined } }),
    [actor?.id, status, priority, category, assignee],
  );

  return (
    <>
      <PageHeader eyebrow="Customer care" title="Customer support" subtitle="Tickets raised by importers and truck owners. Open one to reply, assign it or change its priority and status." />
      <div className="mt-5 grid gap-3 rounded-2xl border border-line bg-card p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
        <Select label="Status" value={status} onChange={setStatus} all="All statuses" options={statusOptions("ticket")} />
        <Select label="Priority" value={priority} onChange={setPriority} all="All priorities" options={statusOptions("ticketPriority")} />
        <Select label="Category" value={category} onChange={setCategory} all="All categories" options={optionList(TICKET_CATEGORIES)} />
        <Select
          label="Assigned to"
          value={assignee}
          onChange={setAssignee}
          all="Anyone"
          options={[{ value: "UNASSIGNED", label: "Unassigned" }, ...adminProfiles.map((profile) => ({ value: profile.userId, label: name(profile.userId) }))]}
        />
      </div>
      <div className="mt-5">
        <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0} empty={{ title: "No tickets match", text: "Change the filters, or there are no tickets yet." }}>
          {(data) => {
            const items = assignee === "UNASSIGNED" ? data.items.filter((item) => !item.assignedTo) : data.items;
            const open = items.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status));
            return (
              <>
                <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Tickets shown" value={items.length} hint="After filters" />
                  <StatCard label="Open" value={open.length} hint="Not resolved or closed" accent="warn" />
                  <StatCard label="Urgent or high" value={open.filter((item) => item.priority === "URGENT" || item.priority === "HIGH").length} hint="Open tickets" accent="bad" />
                  <StatCard label="Unassigned" value={open.filter((item) => !item.assignedTo).length} hint="Open tickets" accent="accent" />
                </div>
                <DataTable
                  columns={[{ label: "Ticket" }, { label: "From" }, { label: "Category" }, { label: "Priority" }, { label: "Assigned to" }, { label: "Updated" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
                  emptyMessage="No tickets match your search."
                  exportName="ibanga-support-tickets"
                  rows={items.map((ticket) => ({
                    id: ticket.id,
                    searchText: `${ticket.ref} ${ticket.subject} ${name(ticket.createdBy)} ${ticket.relatedRef ?? ""}`,
                    filterValue: ticket.status,
                    exportValues: [`${ticket.ref} ${ticket.subject}`, name(ticket.createdBy), TICKET_CATEGORIES[ticket.category], ticket.priority, name(ticket.assignedTo), formatDate(ticket.updatedAt), ticket.status, ""],
                    cells: [
                      <span key="t" className="block min-w-48 max-w-xs whitespace-normal"><strong className="block">{ticket.subject}</strong><span className="text-xs text-muted">{ticket.ref}</span></span>,
                      <span key="f">{name(ticket.createdBy)}<span className="block text-xs text-muted">{ROLE_LABEL[ticket.role]}</span></span>,
                      TICKET_CATEGORIES[ticket.category],
                      <StatusBadge key="p" family="ticketPriority" status={ticket.priority} />,
                      ticket.assignedTo ? name(ticket.assignedTo) : <span key="u" className="text-bad">Unassigned</span>,
                      formatDate(ticket.updatedAt),
                      <StatusBadge key="s" family="ticket" status={ticket.status} />,
                      <div key="a" className="flex justify-end"><ViewLink href={`/dashboard/admin/support/${ticket.id}`} label={`Open ticket ${ticket.ref}`} /></div>,
                    ],
                  }))}
                />
              </>
            );
          }}
        </QueryBoundary>
      </div>
    </>
  );
}

function Select({ label, value, onChange, all, options }: { label: string; value: string; onChange: (value: string) => void; all: string; options: { value: string; label: string }[] }) {
  return (
    <label className="text-sm font-medium text-navy">
      {label}
      <select className={`${controlClass} mt-1`} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{all}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
