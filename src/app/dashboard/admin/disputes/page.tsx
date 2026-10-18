"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { DisputeBadge } from "@/components/status-badge";
import { DataTable, PageHeader, StatCard, ViewLink, formatDate } from "@/components/ui";
import { useIbanga } from "@/lib/store";

export default function AdminDisputesPage() {
  const { disputes, bookings, users, trucks } = useIbanga();
  const open = disputes.filter((d) => d.status === "OPEN");

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <PageHeader
          eyebrow="Fairness"
          title="Disputes"
          subtitle="Review marketplace cases and open one to record a resolution."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3 2.5 20h19L12 3Z" />
              <path d="M12 9.5V14M12 17.5h.01" />
            </svg>
          }
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total disputes" value={disputes.length} hint="Marketplace cases" />
          <StatCard label="Open cases" value={open.length} hint="Require review" accent="warn" />
          <StatCard label="Resolved" value={disputes.length - open.length} hint="Closed with notes" accent="good" />
        </div>
        <div className="mt-5">
          <DataTable
            columns={[{ label: "Route" }, { label: "Reported by" }, { label: "Issue" }, { label: "Filed" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
            filterLabel="All case statuses"
            emptyMessage="No disputes have been raised."
            rows={disputes.map((dispute) => {
              const booking = bookings.find((item) => item.id === dispute.bookingId);
              const importer = users.find((item) => item.id === dispute.raisedBy);
              const truck = booking ? trucks.find((item) => item.id === booking.truckId) : undefined;
              const route = booking ? `${booking.pickupLocation} to ${booking.destination}` : dispute.bookingId;
              return {
                id: dispute.id,
                searchText: `${route} ${importer?.name ?? ""} ${truck?.plateNumber ?? ""} ${dispute.reason}`,
                filterValue: dispute.status,
                exportValues: [route, importer?.name ?? "", dispute.reason, formatDate(dispute.createdAt), dispute.status, dispute.resolutionNotes],
                cells: [
                  <span key={`${dispute.id}-route`}><strong className="block">{route}</strong><span className="text-xs text-muted">{truck?.plateNumber ?? "Truck details unavailable"}</span></span>,
                  importer?.name ?? "—",
                  <span key={`${dispute.id}-reason`} className="max-w-sm whitespace-normal">{dispute.reason}</span>,
                  formatDate(dispute.createdAt),
                  <span key={`${dispute.id}-status`}><DisputeBadge status={dispute.status} /></span>,
                  <div key={`${dispute.id}-action`} className="flex justify-end">
                    <ViewLink href={`/dashboard/admin/disputes/${dispute.id}`} label={`View dispute ${dispute.id}`} />
                  </div>,
                ],
              };
            })}
          />
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
