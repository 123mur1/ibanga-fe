import type { Booking, RefundRequest } from "./types";

/** Booking states in which a paid trip can still go wrong: not started, under way, delivered or disputed. */
const REFUNDABLE_BOOKING_STATUSES: Booking["status"][] = ["ACCEPTED", "IN_PROGRESS", "DELIVERED", "DISPUTED"];

/**
 * Why the importer cannot ask for a refund on this booking right now, or null when they can.
 * A refund comes from the payment held in escrow, so it is possible only while that money has not
 * been paid out. The API applies the same rules.
 */
export function refundBlockedReason(booking: Booking | undefined, refunds: RefundRequest[]): string | null {
  if (!booking) return "This booking could not be found.";
  const payment = booking.payment;
  if (!payment) return "You have not paid for this booking, so there is nothing to refund.";
  if (refunds.some((refund) => refund.bookingId === booking.id && refund.status === "REQUESTED")) {
    return "Your refund request is waiting for an administrator's decision.";
  }
  if (payment.status === "REFUNDED") return "This payment has already been refunded to you.";
  if (payment.status === "RELEASED") {
    return "The payment has already been released to the truck owner, so it can no longer be refunded from iBanga. Request a refund before you confirm receipt.";
  }
  if (booking.dispute?.status === "RESOLVED") return "An administrator has already decided the dispute on this booking.";
  if (!["FUNDED", "HELD"].includes(payment.status)) return "This payment is not held by iBanga, so it cannot be refunded here.";
  if (!REFUNDABLE_BOOKING_STATUSES.includes(booking.status)) return "This trip is complete, so its payment has been settled.";
  return null;
}

/** Whether the importer can ask for a refund on this booking now. */
export function canRequestRefund(booking: Booking | undefined, refunds: RefundRequest[]): boolean {
  return refundBlockedReason(booking, refunds) === null;
}
