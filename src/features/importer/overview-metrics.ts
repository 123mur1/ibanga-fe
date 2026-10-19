import type { Booking, BookingStatus, RefundRequest } from "@/lib/types";
import type { CargoRequest, Shipment } from "@/types/ops";

export type DateRange = { from: string; to: string };
export type StatusFilter = "ALL" | BookingStatus;

/** True when an ISO timestamp falls inside the (inclusive, whole-day) range. Empty bounds are open. */
export function inRange(value: string | undefined | null, range: DateRange): boolean {
  if (!range.from && !range.to) return true;
  if (!value) return false;
  const day = value.slice(0, 10);
  return (!range.from || day >= range.from) && (!range.to || day <= range.to);
}

const ACTIVE_SHIPMENT: Shipment["status"][] = ["SCHEDULED", "PICKUP_CONFIRMED", "LOADED", "DEPARTED", "IN_TRANSIT", "DELAYED", "ARRIVED", "UNLOADING"];
const PAID = ["FUNDED", "HELD", "AUTHORIZED", "RELEASED"];

export type OverviewMetrics = {
  requests: number;
  activeShipments: number;
  completed: number;
  cancelled: number;
  spendingRwf: number;
  outstandingRwf: number;
  outstandingCount: number;
  refundCount: number;
  refundedRwf: number;
  avgDeliveryDays: number | null;
  bookingCount: number;
};

/**
 * Everything the overview KPI cards show. The date range applies to every record (by creation or
 * payment date); the status filter applies to bookings and, through them, to shipments, spending
 * and outstanding payments.
 */
export function computeOverview(input: {
  requests: CargoRequest[];
  bookings: Booking[];
  shipments: Shipment[];
  refunds: RefundRequest[];
  range: DateRange;
  status: StatusFilter;
}): OverviewMetrics {
  const { range, status } = input;
  const bookings = input.bookings.filter((booking) => inRange(booking.createdAt, range) && (status === "ALL" || booking.status === status));
  const ids = new Set(bookings.map((booking) => booking.id));
  const shipments = input.shipments.filter((shipment) => ids.has(shipment.bookingId));

  const outstanding = bookings.filter((booking) => booking.status === "ACCEPTED" && (!booking.payment || booking.payment.status === "PENDING"));
  const refunds = input.refunds.filter((refund) => inRange(refund.createdAt, range));

  const durations = shipments.flatMap((shipment) => {
    const booking = bookings.find((item) => item.id === shipment.bookingId);
    if (!booking || !shipment.evidence?.deliveredAt) return [];
    const days = (new Date(shipment.evidence.deliveredAt).getTime() - new Date(booking.pickupDate).getTime()) / 86_400_000;
    return Number.isFinite(days) ? [Math.max(0, days)] : [];
  });

  return {
    requests: input.requests.filter((request) => inRange(request.createdAt, range)).length,
    activeShipments: shipments.filter((shipment) => ACTIVE_SHIPMENT.includes(shipment.status)).length,
    completed: bookings.filter((booking) => booking.status === "COMPLETED" || booking.status === "DELIVERED").length,
    cancelled: bookings.filter((booking) => booking.status === "REJECTED").length,
    spendingRwf: bookings.reduce((sum, booking) => (booking.payment && PAID.includes(booking.payment.status) ? sum + booking.payment.amountRwf : sum), 0),
    outstandingRwf: outstanding.reduce((sum, booking) => sum + (booking.agreedPriceRwf ?? 0), 0),
    outstandingCount: outstanding.length,
    refundCount: refunds.length,
    refundedRwf: refunds.filter((refund) => refund.status === "APPROVED").reduce((sum, refund) => sum + refund.amountRwf, 0),
    avgDeliveryDays: durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : null,
    bookingCount: bookings.length,
  };
}
