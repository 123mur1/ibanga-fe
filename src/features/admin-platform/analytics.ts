/**
 * Pure aggregation for the administrator analytics page. Inputs are the marketplace store and the
 * operations dataset; nothing here reads a service, so the same functions can run on API results.
 * All figures are derived from demonstration data.
 */
import { effectiveDocumentStatus, expiryState } from "@/config/business-rules";
import type { Booking, RefundRequest, Truck, User } from "@/lib/types";
import type { OpsData, ShipmentStatus } from "@/types/ops";

export type AnalyticsFilters = {
  /** Inclusive YYYY-MM-DD bounds. Empty means open-ended. */
  from: string;
  to: string;
  /** Applies to the shipment figures and charts only. */
  shipmentStatus: ShipmentStatus | "";
};

export type AnalyticsInput = {
  users: User[];
  trucks: Truck[];
  bookings: Booking[];
  refunds: RefundRequest[];
  ops: OpsData;
  /** Reference time for expiry maths. */
  now: Date;
};

export type Kpis = {
  registeredUsers: number;
  pendingVerifications: number;
  activeTrucks: number;
  activeShipments: number;
  completedShipments: number;
  cancelledShipments: number;
  paymentVolumeRwf: number;
  platformRevenueRwf: number;
  pendingSettlementsCount: number;
  pendingSettlementsRwf: number;
  refundVolumeRwf: number;
  openDisputes: number;
  accidents: number;
  insuranceClaims: number;
  documentAlerts: number;
  failedPayouts: number;
  reconciliationDiscrepancies: number;
};

export const inRange = (date: string | undefined | null, filters: Pick<AnalyticsFilters, "from" | "to">): boolean => {
  if (!date) return !filters.from && !filters.to;
  const day = date.slice(0, 10);
  return (!filters.from || day >= filters.from) && (!filters.to || day <= filters.to);
};

const IN_PROGRESS: ShipmentStatus[] = ["SCHEDULED", "PICKUP_CONFIRMED", "LOADED", "DEPARTED", "IN_TRANSIT", "DELAYED", "ARRIVED", "UNLOADING"];
const FINISHED: ShipmentStatus[] = ["DELIVERED", "COMPLETED"];
const UNPAID_SETTLEMENTS = ["AWAITING_DELIVERY", "AWAITING_VERIFICATION", "ON_HOLD", "ELIGIBLE", "PROCESSING"];

/** Records that fall inside the selected range, per dataset. */
export function scope(input: AnalyticsInput, filters: AnalyticsFilters) {
  const { ops, bookings, refunds, users } = input;
  return {
    users: users.filter((user) => user.role !== "ADMIN" && inRange(user.createdAt, filters)),
    paidBookings: bookings.filter((booking) => booking.payment && booking.payment.status !== "PENDING" && inRange(booking.payment.paidAt, filters)),
    shipments: ops.shipments.filter((item) => inRange(item.createdAt, filters) && (!filters.shipmentStatus || item.status === filters.shipmentStatus)),
    refunds: refunds.filter((item) => inRange(item.createdAt, filters)),
    disputes: ops.disputeCases.filter((item) => inRange(item.createdAt, filters)),
    incidents: ops.incidents.filter((item) => inRange(item.createdAt, filters)),
    claims: ops.insuranceClaims.filter((item) => inRange(item.filedAt, filters)),
    settlements: ops.settlements.filter((item) => inRange(item.createdAt, filters)),
    payouts: ops.payouts.filter((item) => inRange(item.createdAt, filters)),
    reconciliation: ops.reconciliation.filter((item) => inRange(item.date, filters)),
  };
}

export function computeKpis(input: AnalyticsInput, filters: AnalyticsFilters): Kpis {
  const data = scope(input, filters);
  const { ops, trucks, now } = input;
  const pending = data.settlements.filter((item) => UNPAID_SETTLEMENTS.includes(item.status));
  const documentAlerts = ops.documents.filter(
    (doc) => effectiveDocumentStatus(doc, now) === "EXPIRED" || (doc.status === "APPROVED" && expiryState(doc.expiryDate, ops.settings.documentWarningDays, now) === "EXPIRING"),
  );
  return {
    registeredUsers: data.users.length,
    pendingVerifications: ops.verificationRequests.filter((item) => item.status === "PENDING").length,
    activeTrucks: trucks.filter((truck) => {
      const profile = ops.truckProfiles.find((item) => item.truckId === truck.id);
      return profile?.verification === "APPROVED" && profile.opsStatus !== "INACTIVE" && profile.opsStatus !== "MAINTENANCE";
    }).length,
    activeShipments: data.shipments.filter((item) => IN_PROGRESS.includes(item.status)).length,
    completedShipments: data.shipments.filter((item) => FINISHED.includes(item.status)).length,
    cancelledShipments: data.shipments.filter((item) => item.status === "CANCELLED").length,
    paymentVolumeRwf: sum(data.paidBookings.map((booking) => booking.payment!.amountRwf)),
    // Commission is revenue only once the payment has been released to the owner.
    platformRevenueRwf: sum(data.paidBookings.filter((booking) => booking.payment!.status === "RELEASED").map((booking) => booking.payment!.commissionRwf)),
    pendingSettlementsCount: pending.length,
    pendingSettlementsRwf: sum(pending.map((item) => item.netAmountRwf)),
    refundVolumeRwf: sum(data.refunds.filter((item) => item.status === "APPROVED").map((item) => item.amountRwf)),
    openDisputes: data.disputes.filter((item) => !["RESOLVED", "REJECTED"].includes(item.status)).length,
    accidents: data.incidents.filter((item) => item.type === "ACCIDENT").length,
    insuranceClaims: data.claims.length,
    documentAlerts: documentAlerts.length,
    failedPayouts: data.payouts.filter((item) => item.status === "FAILED").length,
    reconciliationDiscrepancies: data.reconciliation.filter((item) => ["DISCREPANCY", "UNMATCHED", "DUPLICATE"].includes(item.status)).length,
  };
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/** Count of records per key, in the order of `keys`. */
export function countBy<T>(records: T[], keys: readonly string[], getKey: (record: T) => string): { key: string; count: number }[] {
  return keys.map((key) => ({ key, count: records.filter((record) => getKey(record) === key).length }));
}

export function disputeStatusMix(input: AnalyticsInput, filters: AnalyticsFilters) {
  return countBy(scope(input, filters).disputes, ["OPEN", "UNDER_REVIEW", "AWAITING_INFO", "ESCALATED", "RESOLVED", "REJECTED"], (item) => item.status);
}

export function shipmentStatusMix(input: AnalyticsInput, filters: AnalyticsFilters) {
  return countBy(scope(input, filters).shipments, ["SCHEDULED", "IN_TRANSIT", "DELAYED", "DELIVERED", "COMPLETED", "CANCELLED"], (item) =>
    ["PICKUP_CONFIRMED", "LOADED", "DEPARTED", "ARRIVED", "UNLOADING"].includes(item.status) ? "IN_TRANSIT" : item.status,
  );
}

/** Rows for the Excel export: one line per KPI. */
export function kpiRows(kpis: Kpis): (string | number)[][] {
  return [
    ["Registered users", kpis.registeredUsers],
    ["Pending verifications", kpis.pendingVerifications],
    ["Active trucks", kpis.activeTrucks],
    ["Active shipments", kpis.activeShipments],
    ["Completed shipments", kpis.completedShipments],
    ["Cancelled shipments", kpis.cancelledShipments],
    ["Total payment volume (RWF, simulated)", kpis.paymentVolumeRwf],
    ["Platform revenue (RWF, simulated)", kpis.platformRevenueRwf],
    ["Pending settlements (count)", kpis.pendingSettlementsCount],
    ["Pending settlements (RWF, simulated)", kpis.pendingSettlementsRwf],
    ["Refund volume (RWF, simulated)", kpis.refundVolumeRwf],
    ["Open disputes", kpis.openDisputes],
    ["Accidents", kpis.accidents],
    ["Insurance claims", kpis.insuranceClaims],
    ["Document expiry alerts", kpis.documentAlerts],
    ["Failed payouts", kpis.failedPayouts],
    ["Reconciliation discrepancies", kpis.reconciliationDiscrepancies],
  ];
}
