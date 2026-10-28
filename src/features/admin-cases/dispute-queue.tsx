"use client";

import Link from "next/link";
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
import { DisputeBadge } from "@/components/status-badge";
import { useIbanga } from "@/lib/store";
import { formatRwf } from "@/lib/payments";
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
        subtitle="Review problems importers reported on bookings and cases raised by importers and truck owners. Settling a dispute can refund the importer or release the payment to the owner."
      />
      <ReportedProblems />
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

/**
 * Problems importers reported with "Report problem" on a delivered booking. They are settled from
 * the booking page, where the administrator can refund the importer or pay the owner.
 */
function ReportedProblems() {
  const { disputes, bookings, refunds } = useIbanga();
  const name = useUserNames();
  const open = disputes.filter((dispute) => dispute.status === "OPEN");
  const recent = [...open, ...disputes.filter((dispute) => dispute.status !== "OPEN")].slice(0, 20);
  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-background/60 px-5 py-4">
        <div>
          <h2 className="font-display text-lg text-navy">Problems reported on bookings</h2>
          <p className="text-sm text-muted">
            {open.length ? `${open.length} waiting for your decision.` : "Nothing waiting for a decision."} The payment stays in escrow until you settle it.
          </p>
        </div>
      </div>
      {recent.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">No importer has reported a problem yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {recent.map((dispute) => {
            const booking = bookings.find((item) => item.id === dispute.bookingId);
            const held = booking?.payment && ["FUNDED", "HELD"].includes(booking.payment.status);
            const refundRequest = refunds.find((item) => item.bookingId === dispute.bookingId && item.status === "REQUESTED");
            return (
              <li key={dispute.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-semibold text-navy">{booking ? `${booking.pickupLocation} to ${booking.destination}` : `Booking ${dispute.bookingId}`}</p>
                  <p className="mt-0.5 text-sm text-navy">&ldquo;{dispute.reason}&rdquo;</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Reported by {name(dispute.raisedBy)} on {formatDate(dispute.createdAt)}
                    {held && booking?.payment ? ` · ${formatRwf(booking.payment.amountRwf)} held in escrow` : ""}
                    {booking?.payment?.status === "REFUNDED" ? " · refunded to the importer" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {refundRequest ? (
                    <Link href={`/dashboard/admin/refunds/${refundRequest.id}`} className="text-sm font-semibold text-brand hover:text-brand-dark">
                      Refund requested: {formatRwf(refundRequest.amountRwf)}
                    </Link>
                  ) : null}
                  <DisputeBadge status={dispute.status} />
                  <Link href={`/dashboard/admin/bookings/${dispute.bookingId}`} className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark">
                    {dispute.status === "OPEN" ? "Open and settle" : "View"}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
