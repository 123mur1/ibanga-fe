"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PaymentReceipt } from "@/components/payment-receipt";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { Avatar } from "@/components/photos";
import { FinancialSummary } from "@/components/common/financial-summary";
import { Notice, SimulationNotice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { RefundBadge } from "@/components/status-badge";
import { PageHeader, formatDate, formatDateTime } from "@/components/ui";
import { useAdminAllowed } from "@/hooks/use-admin-allowed";
import { useIbanga } from "@/lib/store";
import { formatRwf } from "@/lib/payments";
import { REFUNDABLE_STATUSES } from "@/lib/demo";
import type { Role } from "@/lib/types";

export function PaymentDetail({
  role,
  backHref,
  backLabel,
}: {
  role: Role;
  backHref: string;
  backLabel: string;
}) {
  const { id } = useParams<{ id: string }>();
  const { bookings, users, trucks, refunds, currentUser } = useIbanga();
  const adminAllowed = useAdminAllowed("payments");
  const found = bookings.find((item) => item.id === id);
  const foundTruck = found ? trucks.find((item) => item.id === found.truckId) : undefined;
  const allowed = Boolean(
    found && (
      role === "ADMIN"
      || (role === "IMPORTER" && found.importerId === currentUser?.id)
      || (role === "TRUCK_OWNER" && foundTruck?.ownerId === currentUser?.id)
    ),
  );
  const booking = allowed ? found : undefined;
  const payment = booking?.payment;
  const importer = booking ? users.find((user) => user.id === booking.importerId) : undefined;
  const truck = foundTruck;
  const refund = booking ? refunds.find((item) => item.bookingId === booking.id) : undefined;
  const canRequestRefund = Boolean(
    role === "IMPORTER" && payment && REFUNDABLE_STATUSES.includes(payment.status) && refund?.status !== "REQUESTED",
  );
  const refundsBase = role === "TRUCK_OWNER" ? "/dashboard/owner/refunds" : "/dashboard/importer/refunds";
  const owner = truck?.owner ?? (truck ? users.find((user) => user.id === truck.ownerId) : undefined);

  return (
    <RequireAuth role={role}>
      <DashboardShell role={role}>
        <Link href={backHref} className="group inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-dark">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand transition duration-200 group-hover:-translate-x-0.5 group-hover:bg-brand group-hover:text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 4-8 8 8 8" />
            </svg>
          </span>
          {backLabel}
        </Link>

        {role === "ADMIN" && !adminAllowed ? (
          <Notice tone="danger" title="Your administrator role does not include this area" action={{ href: "/dashboard/admin", label: "Back to overview" }}>
            Ask a super administrator to grant the permission.
          </Notice>
        ) : booking && !payment ? (
          <div className="mt-4 space-y-4">
            <Notice tone="warning" title="Payment not made yet" action={{ href: role === "IMPORTER" ? `/dashboard/importer/bookings/${booking.id}` : backHref, label: role === "IMPORTER" ? "Open booking to pay" : backLabel }}>
              {role === "IMPORTER"
                ? "This booking is confirmed but nothing has been paid. Accepting a quotation does not charge you. Pay from the booking page to secure the truck."
                : "The importer has not paid for this booking yet."}
            </Notice>
            <SimulationNotice kind="payment" />
          </div>
        ) : !booking || !payment ? (
          <p className="mt-4 rounded-2xl border border-line bg-card px-5 py-10 text-center text-muted">
            This payment could not be found.
          </p>
        ) : (
          <>
            <div className="mt-4">
              <PageHeader
                eyebrow="Payment detail"
                title={payment.receiptNumber}
                subtitle={`${booking.pickupLocation} to ${booking.destination} · ${formatDate(payment.paidAt)}`}
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
                    <path d="M2.5 9.5h19M6.5 15h4" />
                  </svg>
                }
                actions={<StatusBadge family="payment" status={payment.status} />}
              />
            </div>

            <div className="mt-5"><SimulationNotice kind="payment" /></div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,1fr)]">
              <div className="space-y-5">
                <FinancialSummary
                  title="Payment breakdown"
                  lines={[
                    { label: "Agreed transport amount", amountRwf: payment.amountRwf },
                    { label: "Platform fee (6%)", amountRwf: payment.commissionRwf, hint: "Deducted from the truck owner's share, not added to your total" },
                    { label: "Truck owner share", amountRwf: payment.ownerAmountRwf },
                    { label: role === "IMPORTER" ? "Total you paid" : "Total paid by importer", amountRwf: payment.amountRwf, kind: "total" },
                  ]}
                  footnote="Simulated amounts. No real card, mobile money or bank account was charged."
                />

                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft" id="payment-invoice">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-background/60 px-5 py-4">
                    <div>
                      <h2 className="font-display text-lg text-navy">Invoice and references</h2>
                      <p className="mt-1 text-sm text-muted">Reference numbers to quote when you contact support.</p>
                    </div>
                    <button type="button" onClick={() => window.print()} className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-navy transition hover:border-brand print:hidden">
                      Print invoice and receipt
                    </button>
                  </div>
                  <dl className="grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2">
                    <InvoiceItem label="Transaction reference" value={payment.receiptNumber} />
                    <InvoiceItem label="Invoice number" value={`INV-${booking.id.toUpperCase()}`} />
                    <InvoiceItem label="Booking" value={booking.id} />
                    <InvoiceItem label="Invoice date" value={formatDate(payment.paidAt)} />
                    <InvoiceItem label="Billed to" value={payment.payerName} />
                    <InvoiceItem label="Service" value={`Transport, ${booking.pickupLocation} to ${booking.destination}`} />
                  </dl>
                  <p className="border-t border-line px-5 py-3 text-xs text-muted">Demonstration invoice. It is not a tax document.</p>
                </section>

                <PaymentReceipt booking={booking} plate={truck?.plateNumber} />
              </div>

              <aside className="space-y-5">
                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-background/60 px-5 py-4">
                    <h2 className="font-display text-lg text-navy">Parties</h2>
                  </div>
                  <div className="divide-y divide-line">
                    {role !== "IMPORTER" ? (
                      <PartyRow label="Payer (importer)" name={importer?.name} detail={importer?.email} photo={importer?.photo} />
                    ) : null}
                    {role !== "TRUCK_OWNER" ? (
                      <PartyRow label="Truck owner" name={owner?.name} detail={owner?.email ?? undefined} photo={owner?.photo ?? undefined} />
                    ) : null}
                  </div>
                </section>

                {role !== "ADMIN" && (refund || canRequestRefund) ? (
                  <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                    <div className="flex items-center justify-between gap-3 border-b border-line bg-background/60 px-5 py-4">
                      <h2 className="font-display text-lg text-navy">Refund</h2>
                      {refund ? <RefundBadge status={refund.status} /> : null}
                    </div>
                    <div className="space-y-3 px-5 py-5">
                      {refund ? (
                        <>
                          <p className="text-sm text-navy">{refund.reason} · {formatRwf(refund.amountRwf)}</p>
                          {refund.ownerNote ? <p className="text-sm text-muted">Owner note: {refund.ownerNote}</p> : null}
                          <Link href={role === "TRUCK_OWNER" ? `${refundsBase}/${refund.id}` : refundsBase} className="inline-block text-sm font-semibold text-brand hover:text-brand-dark">
                            {role === "TRUCK_OWNER" ? "Review refund request" : "View my refund requests"}
                          </Link>
                        </>
                      ) : (
                        <p className="text-sm text-muted">Something went wrong with this booking? Ask the truck owner for your money back.</p>
                      )}
                      {canRequestRefund && !refund ? (
                        <Link
                          href={`/dashboard/importer/payments/${booking.id}/refund`}
                          className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
                        >
                          Request a refund
                        </Link>
                      ) : null}
                      {canRequestRefund && refund ? (
                        <Link
                          href={`/dashboard/importer/payments/${booking.id}/refund`}
                          className="inline-block text-sm font-semibold text-brand hover:text-brand-dark"
                        >
                          Send a new request
                        </Link>
                      ) : null}
                    </div>
                  </section>
                ) : null}

                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-background/60 px-5 py-4">
                    <h2 className="font-display text-lg text-navy">Escrow timeline</h2>
                  </div>
                  <ol className="space-y-4 px-5 py-5">
                    <TimelineItem tone="bg-brand" title="Payment initiated" detail={formatDateTime(payment.paidAt)} />
                    {payment.heldAt ? <TimelineItem tone="bg-brand" title="Funds moved to escrow" detail={formatDateTime(payment.heldAt)} /> : null}
                    {payment.ownerConfirmedAt ? <TimelineItem tone="bg-brand/70" title="Owner confirmed delivery" detail={formatDateTime(payment.ownerConfirmedAt)} /> : null}
                    {payment.importerConfirmedAt ? <TimelineItem tone="bg-brand/50" title="Importer confirmed receipt" detail={formatDateTime(payment.importerConfirmedAt)} /> : null}
                    {payment.releasedAt ? <TimelineItem tone="bg-navy" title="Released to truck owner" detail={formatDateTime(payment.releasedAt)} /> : null}
                    {payment.refundedAt ? <TimelineItem tone="bg-line" title="Refunded to original method" detail={formatDateTime(payment.refundedAt)} /> : null}
                  </ol>
                  <div className="border-t border-line px-5 py-4">
                    <Link
                      href={role === "ADMIN" ? `/dashboard/admin/bookings/${booking.id}` : role === "TRUCK_OWNER" ? `/dashboard/owner/bookings/${booking.id}` : `/dashboard/importer/bookings/${booking.id}`}
                      className="text-sm font-semibold text-brand hover:text-brand-dark"
                    >
                      View booking details
                    </Link>
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      </DashboardShell>
    </RequireAuth>
  );
}

function InvoiceItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 break-words font-semibold text-navy">{value}</dd>
    </div>
  );
}

function PartyRow({ label, name, detail, photo }: { label: string; name?: string; detail?: string; photo?: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <Avatar src={photo} name={name ?? "Unknown"} size="sm" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="truncate font-semibold text-navy">{name ?? "Unknown"}</p>
        {detail ? <p className="truncate text-xs text-muted">{detail}</p> : null}
      </div>
    </div>
  );
}

function TimelineItem({ tone, title, detail }: { tone: string; title: string; detail: string }) {
  return (
    <li className="flex gap-3">
      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${tone}`} />
      <div>
        <p className="text-sm font-semibold text-navy">{title}</p>
        <p className="text-sm text-muted">{detail}</p>
      </div>
    </li>
  );
}
