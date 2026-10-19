/**
 * Central status definitions. Every status label and colour in the app comes from here so the
 * same state always looks the same. Tones: success = green, warning = amber, danger = red,
 * neutral = grey (inactive/closed), info = blue (in progress), brand = dark navy (final/completed).
 */
export type StatusTone = "success" | "warning" | "danger" | "neutral" | "info" | "brand";

export type StatusDef = { label: string; tone: StatusTone };

const def = (label: string, tone: StatusTone): StatusDef => ({ label, tone });

export const STATUS_DEFS = {
  verification: {
    NOT_SUBMITTED: def("Not submitted", "neutral"),
    PENDING: def("Pending review", "warning"),
    APPROVED: def("Approved", "success"),
    REJECTED: def("Rejected", "danger"),
    EXPIRED: def("Expired", "danger"),
  },
  cargoRequest: {
    DRAFT: def("Draft", "neutral"),
    OPEN: def("Open for quotes", "info"),
    QUOTED: def("Quotes received", "warning"),
    BOOKED: def("Booked", "success"),
    CANCELLED: def("Cancelled", "neutral"),
    EXPIRED: def("Expired", "neutral"),
  },
  quotation: {
    SUBMITTED: def("Submitted", "warning"),
    ACCEPTED: def("Accepted", "success"),
    REJECTED: def("Not selected", "neutral"),
    WITHDRAWN: def("Withdrawn", "neutral"),
    EXPIRED: def("Expired", "neutral"),
  },
  booking: {
    PENDING: def("Pending", "warning"),
    ACCEPTED: def("Confirmed", "info"),
    IN_PROGRESS: def("In transit", "info"),
    DELIVERED: def("Delivered", "success"),
    COMPLETED: def("Completed", "brand"),
    DISPUTED: def("Disputed", "danger"),
    REJECTED: def("Cancelled", "neutral"),
  },
  payment: {
    PENDING: def("Payment pending", "warning"),
    AUTHORIZED: def("Authorised", "warning"),
    FUNDED: def("Paid, held", "success"),
    HELD: def("Paid, held", "success"),
    RELEASED: def("Released", "brand"),
    REFUNDED: def("Refunded", "neutral"),
  },
  shipment: {
    SCHEDULED: def("Scheduled", "neutral"),
    PICKUP_CONFIRMED: def("Pickup confirmed", "info"),
    LOADED: def("Loaded", "info"),
    DEPARTED: def("Departed", "info"),
    IN_TRANSIT: def("In transit", "info"),
    DELAYED: def("Delayed", "warning"),
    ARRIVED: def("Arrived", "info"),
    UNLOADING: def("Unloading", "info"),
    DELIVERED: def("Delivered", "success"),
    COMPLETED: def("Completed", "brand"),
    CANCELLED: def("Cancelled", "neutral"),
  },
  evidence: {
    SUBMITTED: def("Evidence submitted", "warning"),
    VERIFIED: def("Delivery verified", "success"),
    REJECTED: def("Evidence rejected", "danger"),
  },
  settlement: {
    NOT_ELIGIBLE: def("Not eligible", "neutral"),
    AWAITING_DELIVERY: def("Awaiting delivery", "neutral"),
    AWAITING_VERIFICATION: def("Awaiting verification", "warning"),
    ON_HOLD: def("On hold", "danger"),
    ELIGIBLE: def("Eligible for settlement", "info"),
    PROCESSING: def("Processing", "info"),
    PAID: def("Paid", "success"),
    FAILED: def("Failed", "danger"),
    REVERSED: def("Reversed / adjusted", "warning"),
  },
  payout: {
    PROCESSING: def("Processing", "info"),
    PAID: def("Paid", "success"),
    FAILED: def("Failed", "danger"),
  },
  refund: {
    REQUESTED: def("Pending review", "warning"),
    APPROVED: def("Approved", "success"),
    REJECTED: def("Rejected", "danger"),
  },
  cancellation: {
    REQUESTED: def("Requested", "warning"),
    APPROVED: def("Approved", "info"),
    REJECTED: def("Rejected", "danger"),
    COMPLETED: def("Completed", "success"),
  },
  dispute: {
    OPEN: def("Open", "danger"),
    UNDER_REVIEW: def("Under review", "warning"),
    AWAITING_INFO: def("Awaiting information", "warning"),
    RESOLVED: def("Resolved", "success"),
    REJECTED: def("Rejected", "neutral"),
    ESCALATED: def("Escalated", "danger"),
  },
  ticket: {
    OPEN: def("Open", "warning"),
    IN_PROGRESS: def("In progress", "info"),
    AWAITING_CUSTOMER: def("Awaiting customer", "warning"),
    RESOLVED: def("Resolved", "success"),
    CLOSED: def("Closed", "neutral"),
  },
  ticketPriority: {
    LOW: def("Low", "neutral"),
    NORMAL: def("Normal", "info"),
    HIGH: def("High", "warning"),
    URGENT: def("Urgent", "danger"),
  },
  incident: {
    REPORTED: def("Reported", "warning"),
    UNDER_INVESTIGATION: def("Under investigation", "info"),
    CLAIM_FILED: def("Claim filed", "info"),
    RESOLVED: def("Resolved", "success"),
    CLOSED: def("Closed", "neutral"),
  },
  severity: {
    LOW: def("Low", "neutral"),
    MEDIUM: def("Medium", "warning"),
    HIGH: def("High", "danger"),
    CRITICAL: def("Critical", "danger"),
  },
  claim: {
    DRAFT: def("Draft", "neutral"),
    SUBMITTED: def("Submitted", "warning"),
    UNDER_REVIEW: def("Under review", "info"),
    APPROVED: def("Approved (simulated)", "success"),
    REJECTED: def("Rejected", "danger"),
    PAID_SIMULATED: def("Paid (simulated)", "success"),
  },
  driver: {
    AVAILABLE: def("Available", "success"),
    ON_TRIP: def("On a trip", "info"),
    OFF_DUTY: def("Off duty", "neutral"),
    SUSPENDED: def("Suspended", "danger"),
  },
  truckOps: {
    AVAILABLE: def("Available", "success"),
    RESERVED: def("Reserved", "warning"),
    IN_TRANSIT: def("In transit", "info"),
    MAINTENANCE: def("Under maintenance", "warning"),
    INACTIVE: def("Inactive", "neutral"),
  },
  assignment: {
    UPCOMING: def("Upcoming", "info"),
    ACTIVE: def("Active", "success"),
    COMPLETED: def("Completed", "neutral"),
    CANCELLED: def("Cancelled", "neutral"),
  },
  reconciliation: {
    MATCHED: def("Matched", "success"),
    UNMATCHED: def("Unmatched", "danger"),
    PENDING: def("Pending", "warning"),
    DISCREPANCY: def("Discrepancy", "danger"),
    DUPLICATE: def("Possible duplicate", "warning"),
  },
  documentExpiry: {
    VALID: def("Valid", "success"),
    EXPIRING: def("Expiring soon", "warning"),
    EXPIRED: def("Expired", "danger"),
    NO_EXPIRY: def("No expiry", "neutral"),
  },
  announcement: {
    INFO: def("Information", "info"),
    WARNING: def("Warning", "warning"),
    CRITICAL: def("Critical", "danger"),
  },
  account: {
    ACTIVE: def("Active", "success"),
    INACTIVE: def("Inactive", "neutral"),
  },
} as const satisfies Record<string, Record<string, StatusDef>>;

export type StatusFamily = keyof typeof STATUS_DEFS;

export function statusOf(family: StatusFamily, key: string): StatusDef {
  const families = STATUS_DEFS as Record<string, Record<string, StatusDef>>;
  return families[family]?.[key] ?? { label: key.replaceAll("_", " ").toLowerCase(), tone: "neutral" };
}

/** Tailwind classes for each tone. Uses the theme tokens defined in globals.css. */
export const TONE_CLASSES: Record<StatusTone, { badge: string; dot: string }> = {
  success: { badge: "bg-good-soft text-good ring-1 ring-good/15", dot: "bg-good" },
  warning: { badge: "bg-warn-soft text-warn ring-1 ring-warn/15", dot: "bg-warn" },
  danger: { badge: "bg-bad-soft text-bad ring-1 ring-bad/15", dot: "bg-bad" },
  neutral: { badge: "bg-line text-muted ring-1 ring-navy/5", dot: "bg-muted" },
  info: { badge: "bg-brand-soft text-brand-dark ring-1 ring-brand/15", dot: "bg-brand" },
  brand: { badge: "bg-navy text-white ring-1 ring-navy/20", dot: "bg-white" },
};
