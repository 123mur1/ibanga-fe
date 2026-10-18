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

export default function OwnerPaymentsPage() {
  const { bookings, trucks, users, currentUser } = useIbanga();
  const mine = trucks.filter((truck) => truck.ownerId === currentUser?.id);
  const payments = bookings.filter((booking) => booking.payment && mine.some((truck) => truck.id === booking.truckId));
  const share = (filter: (status: PaymentStatus) => boolean) =>
    payments
      .filter((booking) => booking.payment && filter(booking.payment.status))
      .reduce((total, booking) => total + (booking.payment?.ownerAmountRwf ?? 0), 0);

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        <PageHeader
          eyebrow="Money"
          title="Payments"
          subtitle="Payments importers made for your trucks. Your share is released once the trip is confirmed."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
              <path d="M2.5 9.5h19M6.5 15h4" />
            </svg>
          }
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Payments" value={payments.length} hint="On your bookings" />
          <StatCard label="Your total share" value={formatRwf(share((status) => status !== "REFUNDED"))} hint="After the 6% commission" accent="accent" />
          <StatCard label="Held in escrow" value={formatRwf(share((status) => heldStatuses.includes(status)))} hint="Awaiting completion" accent="warn" />
          <StatCard label="Released to you" value={formatRwf(share((status) => status === "RELEASED"))} hint="Paid out" accent="good" />
        </div>

        <div className="mt-5">
          <DataTable
            columns={[
              { label: "Receipt" },
              { label: "Route" },
              { label: "Payer" },
              { label: "Method" },
              { label: "Your share" },
              { label: "Paid" },
              { label: "Status" },
              { label: "Actions", className: "text-right" },
            ]}
            emptyMessage="No payments have been made on your bookings yet."
            filterLabel="All payment statuses"
            exportName="ibanga-owner-payments"
            rows={payments.map((booking) => {
              const payment = booking.payment!;
              const importer = users.find((user) => user.id === booking.importerId);
              const route = `${booking.pickupLocation} to ${booking.destination}`;
              return {
                id: booking.id,
                searchText: `${payment.receiptNumber} ${route} ${payment.payerName} ${importer?.name ?? ""} ${payment.status}`,
                filterValue: payment.status,
                exportValues: [
                  payment.receiptNumber,
                  route,
                  importer?.name ?? payment.payerName,
                  methodLabel[payment.method] ?? payment.method,
                  formatRwf(payment.ownerAmountRwf),
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
                  importer?.name ?? payment.payerName,
                  methodLabel[payment.method] ?? payment.method,
                  <strong key={`${booking.id}-share`}>{formatRwf(payment.ownerAmountRwf)}</strong>,
                  formatDate(payment.paidAt),
                  <span key={`${booking.id}-status`}><PaymentBadge status={payment.status} /></span>,
                  <div key={`${booking.id}-action`} className="flex justify-end">
                    <ViewLink href={`/dashboard/owner/payments/${booking.id}`} label={`View payment ${payment.receiptNumber}`} />
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
