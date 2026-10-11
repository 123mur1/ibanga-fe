"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { DataTable, PageHeader, StatCard, inputClass, PrimaryButton } from "@/components/ui";
import { useIbanga } from "@/lib/store";

export default function AdminDisputesPage() {
  const { disputes, bookings, users, trucks, resolveDispute } = useIbanga();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const open = disputes.filter((d) => d.status === "OPEN");

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <PageHeader
          eyebrow="Fairness"
          title="Disputes"
          subtitle="Resolve the review, then the importer must confirm receipt before funds are released and the truck becomes available."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3 2.5 20h19L12 3Z" />
              <path d="M12 9.5V14M12 17.5h.01" />
            </svg>
          }
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total disputes" value={disputes.length} hint="Marketplace cases" />
          <StatCard label="Open cases" value={open.length} hint="Require review" accent="bad" />
          <StatCard label="Resolved" value={disputes.length - open.length} hint="Closed with notes" accent="good" />
        </div>
        <div className="mt-5">
          <DataTable
            columns={[{ label: "Route" }, { label: "Reported by" }, { label: "Issue" }, { label: "Status" }, { label: "Resolution" }]}
            filterLabel="All case statuses"
            rows={disputes.map((dispute) => {
              const booking = bookings.find((item) => item.id === dispute.bookingId);
              const importer = users.find((item) => item.id === dispute.raisedBy);
              const truck = booking ? trucks.find((item) => item.id === booking.truckId) : undefined;
              const route = booking ? `${booking.pickupLocation} to ${booking.destination}` : dispute.bookingId;
              return {
                id: dispute.id,
                searchText: `${route} ${importer?.name ?? ""} ${truck?.plateNumber ?? ""} ${dispute.reason}`,
                filterValue: dispute.status,
                exportValues: [route, importer?.name ?? "", dispute.reason, dispute.status, dispute.resolutionNotes],
                cells: [
                  <span key={`${dispute.id}-route`}><strong className="block">{route}</strong><span className="text-xs text-muted">{truck?.plateNumber ?? "Truck details unavailable"}</span></span>,
                  importer?.name ?? "—",
                  <span key={`${dispute.id}-reason`} className="max-w-sm whitespace-normal">{dispute.reason}</span>,
                  <span key={`${dispute.id}-status`} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${dispute.status === "OPEN" ? "bg-bad-soft text-bad" : "bg-good-soft text-good"}`}>{dispute.status.replace("_", " ")}</span>,
                  dispute.status === "OPEN" ? (
                    <div key={`${dispute.id}-action`} className="flex min-w-56 items-center gap-2">
                      <input aria-label={`Resolution notes for ${dispute.id}`} placeholder="Resolution notes" value={notes[dispute.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [dispute.id]: event.target.value }))} className={`${inputClass} min-w-28 py-2`} />
                      <PrimaryButton type="button" className="shrink-0 px-3 py-2 text-xs" onClick={() => void resolveDispute(dispute.id, notes[dispute.id] || "Resolved by admin")}>Resolve</PrimaryButton>
                    </div>
                  ) : dispute.resolutionNotes || "Closed",
                ],
              };
            })}
          />
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}