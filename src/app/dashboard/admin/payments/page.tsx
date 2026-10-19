"use client";

import { Suspense } from "react";
import { LoadingBlock } from "@/components/common/async-state";
import { AdminPage } from "@/features/admin-platform/admin-page";
import { PaymentBadge } from "@/components/status-badge";
import { DataTable, PageHeader, StatCard, ViewLink, formatDate } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import { formatRwf } from "@/lib/payments";
import type { PaymentStatus } from "@/lib/types";
import { useSearchParams } from "next/navigation";

const methodLabel: Record<string, string> = {
  VISA: "Visa card",
  AIRTEL: "Airtel Money",
  MTN: "MTN MoMo",
};

const heldStatuses: PaymentStatus[] = ["HELD", "FUNDED", "AUTHORIZED"];

function AdminPaymentsContent() {
  const searchParams = useSearchParams();
  const { bookings, users, adminCommission } = useIbanga();
  const payments = bookings.filter((booking) => booking.payment);
  const totalCollected = payments.reduce((sum, booking) => sum + (booking.payment?.amountRwf ?? 0), 0);
  const heldInEscrow = payments
    .filter((booking) => booking.payment && heldStatuses.includes(booking.payment.status))
    .reduce((sum, booking) => sum + (booking.payment?.amountRwf ?? 0), 0);
  const commissionEarned = adminCommission?.totalEarnedRwf
    ?? payments
      .filter((booking) => booking.payment?.status === "RELEASED")
      .reduce((sum, booking) => sum + (booking.payment?.commissionRwf ?? 0), 0);

  return (
    <AdminPage permission="payments">
      <>
        <PageHeader
          eyebrow="Finance"
          title="Payments"
          subtitle="Every booking payment across the marketplace, with its escrow status and receipt."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
              <path d="M2.5 9.5h19M6.5 15h4" />
            </svg>
          }
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Payments" value={payments.length} hint="Recorded transactions" href="/dashboard/admin/payments" />
          <StatCard label="Total collected" value={formatRwf(totalCollected)} hint="All payment amounts" accent="accent" href="/dashboard/admin/payments" />
          <StatCard label="Held in escrow" value={formatRwf(heldInEscrow)} hint="Awaiting completion" accent="warn" href="/dashboard/admin/payments?status=HELD" />
          <StatCard label="Commission fees earned" value={formatRwf(commissionEarned)} hint="6% platform share" accent="good" href="/dashboard/admin/payments?status=RELEASED" />
        </div>

        <div className="mt-5">
          <DataTable
            initialFilter={searchParams.get("status") ?? ""}
            columns={[
              { label: "Receipt" },
              { label: "Route" },
              { label: "Payer" },
              { label: "Method" },
              { label: "Amount" },
              { label: "Paid" },
              { label: "Status" },
              { label: "Actions", className: "text-right" },
            ]}
            emptyMessage="No payments have been recorded."
            filterLabel="All payment statuses"
            exportName="ibanga-payments"
            rows={payments.map((booking) => {
              const payment = booking.payment!;
              const importer = users.find((user) => user.id === booking.importerId);
              const route = `${booking.pickupLocation} to ${booking.destination}`;
              return {
                id: booking.id,
                searchText: `${payment.receiptNumber} ${route} ${payment.payerName} ${importer?.name ?? ""} ${payment.method} ${payment.status}`,
                filterValue: payment.status,
                exportValues: [
                  payment.receiptNumber,
                  route,
                  payment.payerName,
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
                  <span key={`${booking.id}-payer`}>
                    <strong className="block">{payment.payerName}</strong>
                    <span className="text-xs text-muted">{payment.accountMask}</span>
                  </span>,
                  methodLabel[payment.method] ?? payment.method,
                  <strong key={`${booking.id}-amount`}>{formatRwf(payment.amountRwf)}</strong>,
                  formatDate(payment.paidAt),
                  <span key={`${booking.id}-status`}><PaymentBadge status={payment.status} /></span>,
                  <div key={`${booking.id}-action`} className="flex justify-end">
                    <ViewLink href={`/dashboard/admin/payments/${booking.id}`} label={`View payment ${payment.receiptNumber}`} />
                  </div>,
                ],
              };
            })}
          />
        </div>
      </>
    </AdminPage>
  );
}

export default function AdminPaymentsPage() {
  // useSearchParams needs a Suspense boundary so the page can be prerendered.
  return (
    <Suspense fallback={<LoadingBlock />}>
      <AdminPaymentsContent />
    </Suspense>
  );
}
