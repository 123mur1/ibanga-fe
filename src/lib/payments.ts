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
    return `**** ${digits.slice(-4).padStart(4, "0")}`;
  }
  return `${digits.slice(0, 4) || "07"} *** ${digits.slice(-3) || "000"}`;
}

export function validatePaymentAccount(method: PaymentMethod, raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (method !== "VISA") {
    return digits.length >= 9 && digits.length <= 12
      ? null
      : "Enter a mobile money number with 9 to 12 digits.";
  }

  if (digits.length < 13 || digits.length > 19) return "Enter a Visa card number with 13 to 19 digits.";
  let sum = 0;
  let doubleDigit = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0 ? null : "Check the Visa card number and try again.";
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

  // Requests and owner-confirmed bookings have not been paid yet. Seed a
  // historical payment only for trips that have started or reached an outcome.
  if (["PENDING", "ACCEPTED", "REJECTED"].includes(booking.status)) {
    return { ...booking, payment: null };
  }

  const amount = booking.agreedPriceRwf && booking.agreedPriceRwf > 0 ? booking.agreedPriceRwf : 850000;
  const shares = paymentShares(amount);
  const method = METHODS[booking.id.length % METHODS.length];
  const paidAt = booking.createdAt;
  const status: BookingPayment["status"] = booking.status === "COMPLETED" ? "RELEASED" : "HELD";

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
      heldAt: paidAt,
      releasedAt: status === "RELEASED" ? paidAt : null,
      refundedAt: null,
      ownerConfirmedAt: ownerConfirmed ? paidAt : null,
      importerConfirmedAt: status === "RELEASED" ? paidAt : null,
    },
  };
}
