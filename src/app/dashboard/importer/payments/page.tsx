"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { PaymentBadge } from "@/components/status-badge";
import { DataTable, PageHeader, StatCard, ViewLink, formatDate } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import { formatRwf } from "@/lib/payments";
import type { PaymentStatus } from "@/lib/types";

const methodLabel: Record<string, string> = {
  VISA: "Visa card",
  AIRTEL: "Airtel Money",
  MTN: "MTN MoMo",
};

const heldStatuses: PaymentStatus[] = ["HELD", "FUNDED", "AUTHORIZED"];

export default function ImporterPaymentsPage() {
  const { bookings, currentUser } = useIbanga();
  const payments = bookings.filter((booking) => booking.importerId === currentUser?.id && booking.payment);
  const sum = (filter: (status: PaymentStatus) => boolean) =>
    payments
      .filter((booking) => booking.payment && filter(booking.payment.status))
      .reduce((total, booking) => total + (booking.payment?.amountRwf ?? 0), 0);

  return (
    <RequireAuth role="IMPORTER">
      <DashboardShell role="IMPORTER">
        <PageHeader
          eyebrow="Money"
          title="Payments"
          subtitle="Every payment you have made for a booking, with its escrow status and receipt."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
              <path d="M2.5 9.5h19M6.5 15h4" />
            </svg>
          }
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Payments" value={payments.length} hint="Recorded transactions" />
          <StatCard label="Total paid" value={formatRwf(sum(() => true))} hint="All payment amounts" accent="accent" />
          <StatCard label="Held in escrow" value={formatRwf(sum((status) => heldStatuses.includes(status)))} hint="Awaiting completion" accent="warn" />
          <StatCard label="Released" value={formatRwf(sum((status) => status === "RELEASED"))} hint="Paid to truck owners" accent="good" />
        </div>

        <div className="mt-5">
          <DataTable
            columns={[
              { label: "Receipt" },
              { label: "Route" },
              { label: "Method" },
              { label: "Amount" },
              { label: "Paid" },
              { label: "Status" },
              { label: "Actions", className: "text-right" },
            ]}
            emptyMessage="You have not made any payments yet."
            filterLabel="All payment statuses"
            exportName="ibanga-my-payments"
            rows={payments.map((booking) => {
              const payment = booking.payment!;
              const route = `${booking.pickupLocation} to ${booking.destination}`;
              return {
                id: booking.id,
                searchText: `${payment.receiptNumber} ${route} ${payment.method} ${payment.status}`,
                filterValue: payment.status,
                exportValues: [
                  payment.receiptNumber,
                  route,
                  methodLabel[payment.method] ?? payment.method,
                  formatRwf(payment.amountRwf),
                  formatDate(payment.paidAt),
                  payment.status,
                  "",
                ],
                cells: [
                  <span key={`${booking.id}-receipt`}>
                    <strong className="block text-brand">{payment.receiptNumber}</strong>
                    <span className="text-xs text-muted">{booking.id}</span>
                  </span>,
                  <span key={`${booking.id}-route`} className="min-w-48">
                    <strong className="block">{route}</strong>
                    <span className="text-xs text-muted">{booking.cargoType}</span>
                  </span>,
                  <span key={`${booking.id}-method`}>
                    {methodLabel[payment.method] ?? payment.method}
                    <span className="block text-xs text-muted">{payment.accountMask}</span>
                  </span>,
                  <strong key={`${booking.id}-amount`}>{formatRwf(payment.amountRwf)}</strong>,
                  formatDate(payment.paidAt),
                  <span key={`${booking.id}-status`}><PaymentBadge status={payment.status} /></span>,
                  <div key={`${booking.id}-action`} className="flex justify-end">
                    <ViewLink href={`/dashboard/importer/payments/${booking.id}`} label={`View payment ${payment.receiptNumber}`} />
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
