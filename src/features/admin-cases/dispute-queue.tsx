"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { controlClass } from "@/components/common/form-fields";
import { Notice } from "@/components/common/notices";
import { StatusBadge, statusOptions } from "@/components/common/status-badge";
import { DataTable, PageHeader, StatCard, ViewLink } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate } from "@/lib/format";
import { services } from "@/services";
import type { DisputeCase } from "@/types/ops";
import { useNow, useUserNames } from "../admin-platform/admin-page";
import { agePriority, DISPUTE_CATEGORIES, optionList } from "./constants";

const CLOSED = ["RESOLVED", "REJECTED"];

export function DisputeQueue() {
  const actor = useActor();
  const initial = useSearchParams().get("status") ?? "";
  const [status, setStatus] = useState(initial);
  const [category, setCategory] = useState("");
  const [assignee, setAssignee] = useState("");
  const { adminProfiles } = useOps();
  const name = useUserNames();
  const now = useNow();

  const query = useServiceQuery(
    () =>
      services.disputes.list(actor!, {
        pageSize: 500,
        filters: { status, category, assignedTo: assignee && assignee !== "UNASSIGNED" ? assignee : undefined },
      }),
    [actor?.id, status, category, assignee],
  );

  return (
    <>
      <PageHeader
        eyebrow="Fairness"
        title="Disputes & claims"
        subtitle="Review cases raised by importers and truck owners. Recording a decision here never moves money; refunds and settlements are separate workflows."
      />
      <div className="mt-6">
        <Notice tone="info" title="Settlement hold">
          Opening a dispute places a hold on the owner&apos;s settlement for that shipment. The hold stays until the case is resolved or rejected.
        </Notice>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border border-line bg-card p-4 shadow-soft sm:grid-cols-3">
        <label className="text-sm font-medium text-navy">
          Status
          <select className={`${controlClass} mt-1`} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {statusOptions("dispute").map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-navy">
          Category
          <select className={`${controlClass} mt-1`} value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {optionList(DISPUTE_CATEGORIES).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-navy">
          Assigned to
          <select className={`${controlClass} mt-1`} value={assignee} onChange={(event) => setAssignee(event.target.value)}>
            <option value="">Anyone</option>
            <option value="UNASSIGNED">Unassigned</option>
            {adminProfiles.map((profile) => (
              <option key={profile.userId} value={profile.userId}>{name(profile.userId)}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5">
        <QueryBoundary
          query={query}
          isEmpty={(data) => data.items.length === 0}
          empty={{ title: "No disputes match", text: "Change the filters, or there are no cases to review." }}
        >
          {(data) => {
            const items = assignee === "UNASSIGNED" ? data.items.filter((item) => !item.assignedTo) : data.items;
            return <Results items={items} now={now} name={name} />;
          }}
        </QueryBoundary>
      </div>
    </>
  );
}

function Results({ items, now, name }: { items: DisputeCase[]; now: number; name: (id: string | undefined) => string }) {
  const open = items.filter((item) => !CLOSED.includes(item.status));
  const high = open.filter((item) => agePriority(item.createdAt, false, now).label === "High").length;
  return (
    <>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cases shown" value={items.length} hint="After filters" />
        <StatCard label="Open cases" value={open.length} hint="Not yet closed" accent="warn" />
        <StatCard label="Unassigned" value={open.filter((item) => !item.assignedTo).length} hint="Need an owner" accent="bad" />
        <StatCard label="Waiting 7+ days" value={high} hint="High priority by age" accent="bad" />
      </div>
      <DataTable
        columns={[{ label: "Case" }, { label: "Category" }, { label: "Raised by" }, { label: "Assigned to" }, { label: "Priority" }, { label: "Opened" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
        emptyMessage="No disputes match your search."
        filterLabel="All statuses"
        exportName="ibanga-disputes"
        rows={items.map((item) => {
          const priority = agePriority(item.createdAt, CLOSED.includes(item.status), now);
          const category = DISPUTE_CATEGORIES[item.category];
          return {
            id: item.id,
            searchText: `${item.ref} ${item.bookingId} ${category} ${name(item.raisedBy)} ${item.description}`,
            filterValue: item.status,
            exportValues: [item.ref, category, name(item.raisedBy), name(item.assignedTo), `${priority.label} (${priority.days}d)`, formatDate(item.createdAt), item.status, ""],
            cells: [
              <span key="c" className="min-w-36"><strong className="block">{item.ref}</strong><span className="text-xs text-muted">Booking {item.bookingId}</span></span>,
              category,
              name(item.raisedBy),
              item.assignedTo ? name(item.assignedTo) : <span key="u" className="text-bad">Unassigned</span>,
              <span key="p" className={priority.label === "High" ? "font-semibold text-bad" : priority.label === "Medium" ? "font-semibold text-warn" : "text-muted"}>{priority.label}{priority.label !== "Closed" ? ` · ${priority.days}d` : ""}</span>,
              formatDate(item.createdAt),
              <StatusBadge key="s" family="dispute" status={item.status} />,
              <div key="a" className="flex justify-end"><ViewLink href={`/dashboard/admin/disputes/${item.id}`} label={`Open case ${item.ref}`} /></div>,
            ],
          };
        })}
      />
    </>
  );
}
