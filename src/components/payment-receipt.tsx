"use client";

import { useEffect, useState } from "react";
import type { Booking, BookingPayment } from "@/lib/types";
import { formatRwf } from "@/lib/payments";
import { formatDateTime } from "./ui";

const methodLabel: Record<BookingPayment["method"], string> = {
  VISA: "Visa card",
  AIRTEL: "Airtel Money",
  MTN: "MTN MoMo",
};

const statusCopy: Record<BookingPayment["status"], { label: string; tone: string; note: string }> = {
  PENDING: {
    label: "Waiting for payment",
    tone: "bg-brand-soft text-brand-dark",
    note: "The booking is open. Payment is due after the owner confirms the truck.",
  },
  FUNDED: {
    label: "Payment received",
    tone: "bg-brand-soft text-brand-dark",
    note: "The payment is recorded as held until delivery is confirmed.",
  },
  AUTHORIZED: {
    label: "Paid, waiting for the truck",
    tone: "bg-brand-soft text-brand-dark",
    note: "Payment is recorded and will be held when the owner confirms the truck.",
  },
  HELD: {
    label: "Held in escrow",
    tone: "bg-brand text-white",
    note: "Payment is held until delivery and receipt are confirmed.",
  },
  RELEASED: {
    label: "Released to the truck owner",
    tone: "bg-navy text-white",
    note: "Both delivery confirmations are recorded and the owner share is released.",
  },
  REFUNDED: {
    label: "Refund recorded",
    tone: "bg-line text-muted",
    note: "The refund is recorded against the original payment method.",
  },
};

export function PaymentReceipt({ booking, plate }: { booking: Booking; plate?: string }) {
  const payment = booking.payment;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  if (!payment) return null;
  const status = statusCopy[payment.status];
  const receiptNumber = payment.receiptNumber || `IB-${booking.id.replace(/[^a-z0-9]/gi, "").slice(-10).toUpperCase()}`;
  const paidAt = payment.paidAt || booking.createdAt;
  const paymentMethod = methodLabel[payment.method] ?? "Simulated payment";
  const payerName = payment.payerName || "Importer";
  const accountMask = payment.accountMask || "Not provided";
  const filename = `ibanga-receipt-${receiptNumber.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.pdf`;

  async function makePdf() {
    if (!payment) return null;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const left = 18;
    const right = pageWidth - 18;
    let y = 20;

    const ensureSpace = (height: number) => {
      if (y + height > 278) {
        doc.addPage();
        y = 20;
      }
    };
    const heading = (text: string) => {
      ensureSpace(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 98, 139);
      doc.text(text, left, y);
      y += 7;
    };
    const row = (label: string, value: string) => {
      const lines = doc.splitTextToSize(value || "-", right - left - 50) as string[];
      const height = Math.max(7, lines.length * 5 + 2);
      ensureSpace(height);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(95, 111, 122);
      doc.text(label, left, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(18, 40, 50);
      doc.text(lines, left + 50, y);
      y += height;
    };

    doc.setFillColor(0, 98, 139);
    doc.roundedRect(left, y, right - left, 31, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(255, 255, 255);
    doc.text("iBanga payment receipt", left + 7, y + 11);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(receiptNumber, left + 7, y + 21);
    doc.text(status.label, right - 7, y + 21, { align: "right" });
    y += 40;

    heading("Payment details");
    row("Transaction reference", receiptNumber);
    row("Invoice number", `INV-${booking.id.toUpperCase()}`);
    row("Invoice date", formatDateTime(paidAt));
    row("Payment status", status.label);
    row("Paid at", formatDateTime(paidAt));
    row("Payment method", paymentMethod);
    row("Account", accountMask);
    row("Payer", payerName);
    y += 3;

    heading("Booking details");
    row("Booking reference", booking.id);
    row("Transport route", `${booking.pickupLocation} to ${booking.destination}`);
    row("Cargo", `${booking.cargoType}, ${booking.cargoWeight}`);
    row("Vehicle", plate || "Assigned truck");
    y += 3;

    heading("Amount breakdown (RWF)");
    row("Total paid", formatRwf(payment.amountRwf));
    row("Platform fee (6%)", formatRwf(payment.commissionRwf));
    row("Truck owner share", formatRwf(payment.ownerAmountRwf));
    y += 3;

    heading("Payment record");
    if (payment.heldAt) row("Moved to escrow", formatDateTime(payment.heldAt));
    if (payment.ownerConfirmedAt) row("Owner confirmed delivery", formatDateTime(payment.ownerConfirmedAt));
    if (payment.importerConfirmedAt) row("Importer confirmed receipt", formatDateTime(payment.importerConfirmedAt));
    if (payment.releasedAt) row("Released", formatDateTime(payment.releasedAt));
    if (payment.refundedAt) row("Refund recorded", formatDateTime(payment.refundedAt));

    ensureSpace(17);
    y += 4;
    doc.setDrawColor(210, 222, 228);
    doc.line(left, y, right, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(95, 111, 122);
    return doc;
  }

  async function downloadPdf() {
    setBusy(true);
    setError(null);
    try {
      const doc = await makePdf();
      doc?.save(filename);
    } catch {
      setError("The PDF could not be created. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function previewPdf() {
    setBusy(true);
    setError(null);
    try {
      const doc = await makePdf();
      if (!doc) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(doc.output("blob")));
      setPreviewOpen(true);
    } catch {
      setError("The PDF preview could not be opened. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-line bg-card shadow-soft" id="payment-receipt">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b-4 border-brand bg-background px-5 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">iBanga payment receipt</p>
            <h2 className="mt-1 text-xl font-semibold text-navy">{receiptNumber}</h2>
            <p className="mt-1 text-sm text-muted">Booking {booking.id}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${status.tone}`}>{status.label}</span>
        </div>
        <dl className="grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2">
          <Item label="Paid at" value={formatDateTime(paidAt)} />
          <Item label="Payment method" value={paymentMethod} />
          <Item label="Payer" value={payerName} />
          <Item label="Invoice number" value={`INV-${booking.id.toUpperCase()}`} />
          <Item label="Account" value={accountMask} />
          <Item label="Total paid" value={formatRwf(payment.amountRwf)} />
          <Item label="Platform fee (6%)" value={formatRwf(payment.commissionRwf)} />
          <Item label="Truck owner share" value={formatRwf(payment.ownerAmountRwf)} />
          <Item label="Route" value={`${booking.pickupLocation} to ${booking.destination}`} />
          <Item label="Cargo" value={`${booking.cargoType}, ${booking.cargoWeight}`} />
          <Item label="Vehicle" value={plate || "Assigned truck"} />
          {payment.heldAt ? <Item label="Moved to escrow" value={formatDateTime(payment.heldAt)} /> : null}
          {payment.ownerConfirmedAt ? <Item label="Owner confirmed delivery" value={formatDateTime(payment.ownerConfirmedAt)} /> : null}
          {payment.importerConfirmedAt ? <Item label="Importer confirmed receipt" value={formatDateTime(payment.importerConfirmedAt)} /> : null}
          {payment.releasedAt ? <Item label="Released" value={formatDateTime(payment.releasedAt)} /> : null}
          {payment.refundedAt ? <Item label="Refund recorded" value={formatDateTime(payment.refundedAt)} /> : null}
        </dl>
        <div className="border-t border-line px-5 py-4">
          <p className="text-sm text-navy">{status.note}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void previewPdf()} className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-navy transition hover:border-brand disabled:opacity-50">
              {busy ? "Preparing PDF..." : "Preview PDF"}
            </button>
            <button type="button" disabled={busy} onClick={() => void downloadPdf()} className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50">
              Download PDF
            </button>
          </div>
          {error ? <p role="alert" className="mt-2 text-sm font-medium text-bad">{error}</p> : null}
        </div>
      </section>

      {previewOpen && previewUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewOpen(false); }}>
          <section className="flex h-[min(90vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-card" role="dialog" aria-modal="true" aria-labelledby="receipt-preview-title">
            <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <h2 id="receipt-preview-title" className="font-semibold text-navy">Payment receipt preview</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => void downloadPdf()} className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Download PDF</button>
                <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Close preview" className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-navy hover:border-brand">Close</button>
              </div>
            </header>
            <iframe title="Payment receipt PDF" src={previewUrl} className="min-h-0 flex-1 bg-background" />
          </section>
        </div>
      ) : null}
    </>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 break-words font-semibold text-navy">{value}</dd>
    </div>
  );
}
