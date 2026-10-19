/**
 * Demonstration business rules, centralised so they can be replaced by backend results later.
 *
 * IMPORTANT: these functions only decide what the UI SHOWS. The backend must enforce the same
 * rules authoritatively (payment confirmation, settlement eligibility, refund amounts, document
 * restrictions, idempotency). Nothing here moves money or proves a delivery.
 */
import { paymentShares } from "@/lib/payments";
import type { Booking } from "@/lib/types";
import type {
  CancellationStage,
  OpsDocument,
  Rwf,
  Shipment,
  SettlementStatus,
  TruckProfile,
  VerificationStatus,
  Driver,
} from "@/types/ops";

export const PLATFORM_FEE_RATE = 0.06;
export const DEFAULT_DOCUMENT_WARNING_DAYS = 30;
export const DEFAULT_QUOTATION_VALIDITY_DAYS = 7;

/* ---------------------------------------------------------------- fees */

export type FeeBreakdown = {
  /** Agreed transport price. */
  agreedRwf: Rwf;
  /** Platform commission, deducted from the owner's side. */
  platformFeeRwf: Rwf;
  /** Net amount the owner receives before any adjustments. */
  ownerNetRwf: Rwf;
  /** Additional approved charges added to the importer's total (none by default). */
  additionalChargesRwf: Rwf;
  taxesRwf: Rwf;
  /** What the importer pays in total. */
  totalPayableRwf: Rwf;
};

export function feeBreakdown(agreedRwf: Rwf, additionalChargesRwf = 0, taxesRwf = 0): FeeBreakdown {
  const shares = paymentShares(agreedRwf);
  return {
    agreedRwf,
    platformFeeRwf: shares.commissionRwf,
    ownerNetRwf: shares.ownerAmountRwf,
    additionalChargesRwf,
    taxesRwf,
    totalPayableRwf: agreedRwf + additionalChargesRwf + taxesRwf,
  };
}

export function netPayable(agreedRwf: Rwf, platformFeeRwf: Rwf, deductionsRwf: Rwf, adjustmentsRwf: Rwf): Rwf {
  return Math.max(0, agreedRwf - platformFeeRwf - deductionsRwf + adjustmentsRwf);
}

/* ---------------------------------------------------------------- cancellation & refunds */

export type CancellationPolicyRow = {
  stage: CancellationStage;
  label: string;
  /** Share of the paid amount kept as a cancellation fee. */
  feeRate: number;
  summary: string;
};

export const CANCELLATION_POLICY: CancellationPolicyRow[] = [
  {
    stage: "BEFORE_PAYMENT",
    label: "After booking, before payment",
    feeRate: 0,
    summary: "No payment has been taken, so no fee applies and nothing needs to be refunded.",
  },
  {
    stage: "AFTER_PAYMENT",
    label: "After payment, before pickup",
    feeRate: 0.1,
    summary: "A 10% cancellation fee applies. The remaining 90% is refunded once an administrator approves.",
  },
  {
    stage: "AFTER_PICKUP",
    label: "After pickup",
    feeRate: 0.5,
    summary: "A 50% fee applies because the truck has already collected the cargo. Subject to administrator review.",
  },
];

export type CancellationOutcome = {
  stage: CancellationStage;
  paidAmountRwf: Rwf;
  feeRwf: Rwf;
  refundRwf: Rwf;
  requiresReview: boolean;
  note: string;
};

/** Not every cancellation is a full refund: the outcome depends on how far the booking got. */
export function calculateCancellation(stage: CancellationStage, paidAmountRwf: Rwf): CancellationOutcome {
  const row = CANCELLATION_POLICY.find((item) => item.stage === stage) ?? CANCELLATION_POLICY[0];
  const feeRwf = Math.round(paidAmountRwf * row.feeRate);
  return {
    stage,
    paidAmountRwf,
    feeRwf,
    refundRwf: Math.max(0, paidAmountRwf - feeRwf),
    requiresReview: stage !== "BEFORE_PAYMENT",
    note: row.summary,
  };
}

/** Which cancellation stage applies to a booking, or null when it can no longer be cancelled. */
export function cancellationStageFor(booking: Booking, shipment?: Shipment): CancellationStage | null {
  if (["COMPLETED", "REJECTED", "DELIVERED", "DISPUTED"].includes(booking.status)) return null;
  const paid = Boolean(booking.payment && ["FUNDED", "HELD", "AUTHORIZED"].includes(booking.payment.status));
  if (!paid) return "BEFORE_PAYMENT";
  const pickedUp = booking.status === "IN_PROGRESS" || (shipment ? shipment.status !== "SCHEDULED" : false);
  return pickedUp ? "AFTER_PICKUP" : "AFTER_PAYMENT";
}

/* ---------------------------------------------------------------- settlement eligibility */

export type SettlementEvaluation = { status: SettlementStatus; reasons: string[] };

/**
 * Whether the owner's settlement may be released. A shipment is not "delivered" because someone
 * changed a status: it needs submitted evidence AND administrator verification, with no hold.
 */
export function evaluateSettlement(input: {
  booking: Booking;
  shipment?: Shipment;
  openDispute: boolean;
  openIncident: boolean;
}): SettlementEvaluation {
  const { booking, shipment } = input;
  const reasons: string[] = [];
  const paid = Boolean(booking.payment && ["FUNDED", "HELD", "RELEASED"].includes(booking.payment.status));
  if (booking.payment?.status === "REFUNDED" || booking.status === "REJECTED") {
    return { status: "NOT_ELIGIBLE", reasons: ["The booking was cancelled or the payment was refunded."] };
  }
  if (!paid) return { status: "NOT_ELIGIBLE", reasons: ["The importer's payment has not been confirmed."] };
  if (input.openDispute) return { status: "ON_HOLD", reasons: ["An open dispute holds this settlement."] };
  if (input.openIncident) return { status: "ON_HOLD", reasons: ["An unresolved incident holds this settlement."] };
  if (!shipment || !["DELIVERED", "COMPLETED"].includes(shipment.status)) {
    return { status: "AWAITING_DELIVERY", reasons: ["The shipment has not been marked delivered."] };
  }
  if (!shipment.evidence) {
    return { status: "AWAITING_DELIVERY", reasons: ["Delivery evidence has not been submitted."] };
  }
  if (shipment.evidence.verification !== "VERIFIED") {
    reasons.push(
      shipment.evidence.verification === "REJECTED"
        ? "Delivery evidence was rejected and must be resubmitted."
        : "Delivery evidence is submitted but not yet verified by an administrator.",
    );
    return { status: "AWAITING_VERIFICATION", reasons };
  }
  return { status: "ELIGIBLE", reasons: ["Delivery verified and no holds apply."] };
}

/* ---------------------------------------------------------------- documents & eligibility */

export type ExpiryState = "VALID" | "EXPIRING" | "EXPIRED" | "NO_EXPIRY";

export function daysUntil(date: string, now: Date = new Date()): number {
  const target = new Date(date).getTime();
  const start = new Date(now).setHours(0, 0, 0, 0);
  return Math.ceil((target - start) / 86_400_000);
}

export function expiryState(expiryDate: string | undefined, warningDays = DEFAULT_DOCUMENT_WARNING_DAYS, now: Date = new Date()): ExpiryState {
  if (!expiryDate) return "NO_EXPIRY";
  const days = daysUntil(expiryDate, now);
  if (days < 0) return "EXPIRED";
  if (days <= warningDays) return "EXPIRING";
  return "VALID";
}

/** A document's effective status: an approved document past its expiry date counts as expired. */
export function effectiveDocumentStatus(doc: OpsDocument, now: Date = new Date()): VerificationStatus {
  if (doc.status === "APPROVED" && expiryState(doc.expiryDate, 0, now) === "EXPIRED") return "EXPIRED";
  return doc.status;
}

export type Eligibility = { eligible: boolean; reasons: string[] };

/** Whether a truck may take new work. The backend must enforce this restriction for real. */
export function truckEligibility(
  profile: TruckProfile | undefined,
  documents: OpsDocument[],
  now: Date = new Date(),
): Eligibility {
  const reasons: string[] = [];
  if (!profile) return { eligible: false, reasons: ["Truck profile is incomplete."] };
  if (profile.verification !== "APPROVED") reasons.push("The truck is not verified.");
  if (profile.opsStatus === "MAINTENANCE" || profile.opsStatus === "INACTIVE") reasons.push("The truck is not in service.");
  const required = ["VEHICLE_REGISTRATION", "VEHICLE_INSPECTION", "INSURANCE_POLICY"] as const;
  for (const type of required) {
    const doc = documents.find((item) => item.type === type && item.subjectKind === "TRUCK" && item.subjectId === profile.truckId);
    const label = type.replaceAll("_", " ").toLowerCase();
    if (!doc) reasons.push(`Missing ${label}.`);
    else if (effectiveDocumentStatus(doc, now) === "EXPIRED") reasons.push(`The ${label} has expired.`);
    else if (doc.status !== "APPROVED") reasons.push(`The ${label} is not approved yet.`);
  }
  return { eligible: reasons.length === 0, reasons };
}

export function driverEligibility(driver: Driver, documents: OpsDocument[], now: Date = new Date()): Eligibility {
  const reasons: string[] = [];
  if (driver.status === "SUSPENDED") reasons.push("The driver is suspended.");
  if (expiryState(driver.licenceExpiry, 0, now) === "EXPIRED") reasons.push("The driving licence has expired.");
  if (driver.verification !== "APPROVED") reasons.push("The driver is not verified.");
  const licence = documents.find((item) => item.type === "DRIVER_LICENCE" && item.subjectId === driver.id);
  if (!licence) reasons.push("No licence document has been uploaded.");
  else if (effectiveDocumentStatus(licence, now) === "EXPIRED") reasons.push("The licence document has expired.");
  return { eligible: reasons.length === 0, reasons };
}
