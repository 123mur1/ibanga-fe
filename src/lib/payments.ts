import type { Booking, BookingPayment, PaymentMethod } from "./types";

const METHODS: PaymentMethod[] = ["VISA", "AIRTEL", "MTN"];

export function formatRwf(amount: number) {
  return `RWF ${Math.round(amount).toLocaleString("en-RW")}`;
}

export function paymentShares(amountRwf: number) {
  const commissionRwf = Math.round(amountRwf * 0.06);
  return {
    amountRwf,
    commissionRwf,
    ownerAmountRwf: amountRwf - commissionRwf,
  };
}

export function maskAccount(method: PaymentMethod, raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (method === "VISA") {
    const last4 = digits.slice(-4).padStart(4, "0");
    return `•••• ${last4}`;
  }
  const tail = digits.slice(-3);
  return `${digits.slice(0, 4) || "07"} ••• ${tail || "000"}`;
}

export function hydrateBooking(booking: Booking): Booking {
  const existing = booking.payment;
  if (existing?.paidAt && existing.receiptNumber && existing.method) {
    const status = (existing.status as string) === "FUNDED" ? "HELD" : existing.status;
    return {
      ...booking,
      payment: {
        ...existing,
        status,
        heldAt: existing.heldAt ?? (existing as { fundedAt?: string | null }).fundedAt ?? null,
      },
    };
  }

  const amount = booking.agreedPriceRwf && booking.agreedPriceRwf > 0 ? booking.agreedPriceRwf : 850000;
  const shares = paymentShares(amount);
  const method = METHODS[booking.id.length % METHODS.length];
  const paidAt = booking.createdAt;
  let status: BookingPayment["status"] = "AUTHORIZED";
  if (booking.status === "REJECTED") status = "REFUNDED";
  else if (booking.status === "COMPLETED") status = "RELEASED";
  else if (booking.status !== "PENDING") status = "HELD";

  const ownerConfirmed = ["DELIVERED", "COMPLETED", "DISPUTED"].includes(booking.status);
  return {
    ...booking,
    agreedPriceRwf: booking.agreedPriceRwf ?? amount,
    agreedPrice: booking.agreedPrice || formatRwf(amount),
    payment: {
      status,
      method,
      ...shares,
      paidAt,
      receiptNumber: `IB-${booking.id.replace(/[^a-z0-9]/gi, "").slice(-10).toUpperCase()}`,
      payerName: "Recorded payer",
      accountMask: method === "VISA" ? "•••• 4242" : "078 ••• 220",
      heldAt: status === "AUTHORIZED" ? null : paidAt,
      releasedAt: status === "RELEASED" ? paidAt : null,
      refundedAt: status === "REFUNDED" ? paidAt : null,
      ownerConfirmedAt: ownerConfirmed ? paidAt : null,
      importerConfirmedAt: status === "RELEASED" ? paidAt : null,
    },
  };
}
