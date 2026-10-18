"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { RefundBadge } from "@/components/status-badge";
import { DataTable, PageHeader, StatCard, ViewLink, formatDate } from "@/components/ui";
import { formatRwf } from "@/lib/payments";
import { useIbanga } from "@/lib/store";

export default function ImporterRefundsPage() {
  const { refunds, bookings, currentUser } = useIbanga();
  const mine = refunds.filter((refund) => refund.importerId === currentUser?.id);
  const count = (status: string) => mine.filter((refund) => refund.status === status).length;
  const refunded = mine.filter((refund) => refund.status === "APPROVED").reduce((sum, refund) => sum + refund.amountRwf, 0);

  return (
    <RequireAuth role="IMPORTER">
      <DashboardShell role="IMPORTER">
        <PageHeader
          eyebrow="Money"
          title="Refunds"
          subtitle="Refund requests you sent to truck owners. Start a new one from the payment you want back."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
              <path d="M12 8v4l2.5 1.5" />
            </svg>
          }
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Requests" value={mine.length} hint="All refund requests" />
          <StatCard label="Pending review" value={count("REQUESTED")} hint="Waiting for the owner" accent="warn" />
          <StatCard label="Approved" value={count("APPROVED")} hint="Money returned" accent="good" />
          <StatCard label="Refunded" value={formatRwf(refunded)} hint="Total approved amount" accent="accent" />
        </div>

        <div className="mt-5">
          <DataTable
            columns={[
              { label: "Route" },
              { label: "Reason" },
              { label: "Amount" },
              { label: "Requested" },
              { label: "Status" },
              { label: "Actions", className: "text-right" },
            ]}
            emptyMessage="You have not requested any refunds. Open a payment to request one."
            filterLabel="All refund statuses"
            exportName="ibanga-my-refunds"
            rows={mine.map((refund) => {
              const booking = bookings.find((item) => item.id === refund.bookingId);
              const route = booking ? `${booking.pickupLocation} to ${booking.destination}` : refund.bookingId;
              return {
                id: refund.id,
                searchText: `${route} ${refund.reason} ${refund.status}`,
                filterValue: refund.status,
                exportValues: [route, refund.reason, formatRwf(refund.amountRwf), formatDate(refund.createdAt), refund.status, ""],
                cells: [
                  <span key={`${refund.id}-route`} className="min-w-44">
                    <strong className="block">{route}</strong>
                    <span className="text-xs text-muted">{booking?.payment?.receiptNumber ?? refund.bookingId}</span>
                  </span>,
                  <span key={`${refund.id}-reason`} className="block max-w-xs whitespace-normal">
                    {refund.reason}
                    {refund.ownerNote ? <span className="block text-xs text-muted">Owner: {refund.ownerNote}</span> : null}
                  </span>,
                  <strong key={`${refund.id}-amount`}>{formatRwf(refund.amountRwf)}</strong>,
                  formatDate(refund.createdAt),
                  <span key={`${refund.id}-status`}><RefundBadge status={refund.status} /></span>,
                  <div key={`${refund.id}-action`} className="flex justify-end">
                    <ViewLink href={`/dashboard/importer/payments/${refund.bookingId}`} label="View payment" />
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
