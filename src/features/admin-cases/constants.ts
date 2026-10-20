import type { DisputeCategory, DisputeDecisionType, TicketCategory, TicketPriority } from "@/types/ops";

export const DISPUTE_CATEGORIES: Record<DisputeCategory, string> = {
  DAMAGED_CARGO: "Damaged cargo",
  MISSING_CARGO: "Missing cargo",
  LATE_DELIVERY: "Late delivery",
  PAYMENT_ISSUE: "Payment issue",
  OVERCHARGE: "Overcharge",
  DRIVER_CONDUCT: "Driver conduct",
  OTHER: "Other",
};

export const DECISION_TYPES: Record<DisputeDecisionType, string> = {
  NO_ACTION: "No action",
  PARTIAL_REFUND: "Partial refund to importer",
  FULL_REFUND: "Full refund to importer",
  COMPENSATION: "Compensation",
  RELEASE_TO_OWNER: "Release payment to owner",
};

export const TICKET_CATEGORIES: Record<TicketCategory, string> = {
  ACCOUNT: "Account",
  BOOKING: "Booking",
  PAYMENT: "Payment",
  SHIPMENT: "Shipment",
  TECHNICAL: "Technical",
  OTHER: "Other",
};

export const TICKET_PRIORITIES: TicketPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

export const ROLE_LABEL = { IMPORTER: "Importer", TRUCK_OWNER: "Truck owner", DRIVER: "Driver", ADMIN: "Administrator" } as const;

export function optionList(map: Record<string, string>) {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}

/** Age-based priority for an open case. Closed cases have no priority. */
export function agePriority(createdAt: string, closed: boolean, now: number): { label: "High" | "Medium" | "Normal" | "Closed"; days: number } {
  const days = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 86_400_000));
  if (closed) return { label: "Closed", days };
  return { label: days >= 7 ? "High" : days >= 3 ? "Medium" : "Normal", days };
}
