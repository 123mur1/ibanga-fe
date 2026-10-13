"use client";

import type { Booking, BookingPayment } from "@/lib/types";
import { formatRwf } from "@/lib/payments";
import { formatDateTime } from "./ui";

const methodLabel: Record<BookingPayment["method"], string> = {
  VISA: "Visa card",
  AIRTEL: "Airtel Money",
  MTN: "MTN MoMo",
};

const statusCopy: Record<BookingPayment["status"], { label: string; tone: string; note: string }> = {
  AUTHORIZED: {
    label: "Paid, waiting for the truck",
    tone: "bg-warn-soft text-warn",
    note: "Collected from the payer. It moves into the iBanga account when the owner confirms the truck.",
  },
  HELD: {
    label: "Held in the iBanga account",
    tone: "bg-brand-soft text-brand-dark",
    note: "Released only after the owner confirms delivery and the importer confirms receipt.",
  },
  RELEASED: {
    label: "Released to the truck owner",
    tone: "bg-good-soft text-good",
    note: "Both delivery confirmations are recorded. The owner share has been paid out.",
  },
  REFUNDED: {
    label: "Refunded to the original method",
    tone: "bg-warn-soft text-warn",
    note: "The trip did not complete. The amount is returned to the Visa, Airtel, or MTN account used at booking.",
  },
};

export function PaymentReceipt({
  booking,
  plate,
}: {
  booking: Booking;
  plate?: string;
}) {
  const payment = booking.payment;
  if (!payment) return null;
  const status = statusCopy[payment.status];

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft" id="payment-receipt">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-brand-soft/40 px-5 py-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">iBanga payment receipt</p>
          <h2 className="mt-1 text-xl font-semibold text-navy">{payment.receiptNumber}</h2>
          <p className="mt-1 text-sm text-muted">Kigali, Rwanda · Freight escrow</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${status.tone}`}>{status.label}</span>
      </div>
      <dl className="grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2">
        <Item label="Paid at" value={formatDateTime(payment.paidAt)} />
        <Item label="Method" value={methodLabel[payment.method]} />
        <Item label="Payer" value={payment.payerName} />
        <Item label="Account" value={payment.accountMask} />
        <Item label="Amount" value={formatRwf(payment.amountRwf)} />
        <Item label="Booking" value={booking.id} />
        <Item label="Route" value={`${booking.pickupLocation} to ${booking.destination}`} />
        <Item label="Cargo" value={`${booking.cargoType} · ${booking.cargoWeight}`} />
        <Item label="Vehicle" value={plate || "Assigned truck"} />
        <Item label="Owner share after 6%" value={formatRwf(payment.ownerAmountRwf)} />
        {payment.heldAt ? <Item label="Moved to escrow" value={formatDateTime(payment.heldAt)} /> : null}
        {payment.ownerConfirmedAt ? <Item label="Owner confirmed delivery" value={formatDateTime(payment.ownerConfirmedAt)} /> : null}
        {payment.importerConfirmedAt ? <Item label="Importer confirmed receipt" value={formatDateTime(payment.importerConfirmedAt)} /> : null}
        {payment.releasedAt ? <Item label="Released" value={formatDateTime(payment.releasedAt)} /> : null}
        {payment.refundedAt ? <Item label="Refunded" value={formatDateTime(payment.refundedAt)} /> : null}
      </dl>
      <div className="border-t border-line px-5 py-4">
        <p className="text-sm text-navy">{status.note}</p>
        <button
          type="button"
          onClick={() => window.print()}
          className="mt-3 text-sm font-semibold text-brand hover:text-brand-dark"
        >
          Print receipt
        </button>
      </div>
    </section>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold text-navy">{value}</dd>
    </div>
  );
}
