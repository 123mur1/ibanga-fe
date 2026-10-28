import type { Booking, RefundRequest } from "./types";

/** Booking states in which a paid trip can still go wrong: not started, under way, delivered or disputed. */
const REFUNDABLE_BOOKING_STATUSES: Booking["status"][] = ["ACCEPTED", "IN_PROGRESS", "DELIVERED", "DISPUTED"];

/**
 * Whether the importer can ask for a refund: the money is still held in escrow, the trip is not
 * completed, no decision has been made on its dispute, and no request is already waiting.
 * The API applies the same rules.
 */
export function canRequestRefund(booking: Booking | undefined, refunds: RefundRequest[]): boolean {
  if (!booking?.payment || !["FUNDED", "HELD"].includes(booking.payment.status)) return false;
  if (!REFUNDABLE_BOOKING_STATUSES.includes(booking.status)) return false;
  if (booking.dispute?.status === "RESOLVED") return false;
  return !refunds.some((refund) => refund.bookingId === booking.id && refund.status === "REQUESTED");
}
