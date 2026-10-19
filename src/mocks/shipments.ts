/** Demonstration shipments, settlements and payouts. SAMPLE DATA. */
import { seedBookings, seedTrucks } from "@/lib/mock-data";
import { paymentShares } from "@/lib/payments";
import type {
  DeliveryEvidence,
  EvidenceVerification,
  MilestoneKind,
  Payout,
  Settlement,
  SettlementHistoryEntry,
  SettlementStatus,
  Shipment,
  ShipmentMilestone,
  ShipmentStatus,
} from "@/types/ops";
import { at, day, ref, sampleFile } from "./helpers";

type BookingInfo = { bookingId: string; ownerId: string; importerId: string; truckId: string; amount: number; from: string; to: string };

function info(bookingId: string): BookingInfo {
  const booking = seedBookings.find((item) => item.id === bookingId);
  if (!booking) throw new Error(`Seed booking ${bookingId} is missing`);
  const truck = seedTrucks.find((item) => item.id === booking.truckId);
  return {
    bookingId,
    ownerId: truck?.ownerId ?? "u-owner",
    importerId: booking.importerId,
    truckId: booking.truckId,
    amount: booking.agreedPriceRwf ?? 850_000,
    from: booking.pickupLocation,
    to: booking.destination,
  };
}

const milestone = (id: string, kind: MilestoneKind, when: string, place: string, note: string, by: string, simulated = true): ShipmentMilestone => ({
  id, kind, at: when, place, note, recordedBy: by, simulated,
});

function evidence(
  by: string,
  deliveredAt: string,
  recipient: string,
  verification: EvidenceVerification,
  options: { notes?: string; damage?: boolean; shortage?: boolean; verifiedAt?: string; rejection?: string } = {},
): DeliveryEvidence {
  return {
    submittedAt: deliveredAt,
    submittedBy: by,
    recipientName: recipient,
    confirmationCode: "DEMO-4821",
    photos: [sampleFile("Delivery photo", "Cargo at the delivery point"), sampleFile("Delivery note", "Signed delivery note")],
    deliveredAt,
    notes: options.notes ?? "Cargo delivered complete and in good condition.",
    damageReported: Boolean(options.damage),
    shortageReported: Boolean(options.shortage),
    verification,
    verifiedAt: options.verifiedAt,
    verifiedBy: verification === "SUBMITTED" ? undefined : "u-admin-ops",
    rejectionReason: options.rejection,
  };
}

let shipmentSerial = 0;

function shipment(
  n: string,
  b: BookingInfo,
  driverId: string | undefined,
  status: ShipmentStatus,
  etaDay: number,
  milestones: ShipmentMilestone[],
  extra: Partial<Shipment> = {},
): Shipment {
  return {
    id: `sh${n}`,
    ref: ref("SHP", (shipmentSerial += 1)),
    bookingId: b.bookingId,
    ownerId: b.ownerId,
    importerId: b.importerId,
    truckId: b.truckId,
    driverId,
    status,
    etaDate: day(etaDay),
    milestones,
    createdAt: milestones[0]?.at ?? at(-10),
    ...extra,
  };
}

const b2 = info("b2");
const b3 = info("b3");
const b4 = info("b4");
const b5 = info("b5");
const b6 = info("b6");
const g5 = info("booking-u-owner-5");
const g12 = info("booking-u-owner-12");
const a5 = info("booking-u-owner-2-5");
const g19 = info("booking-u-owner-19");
const g26 = info("booking-u-owner-26");

const completed = (n: string, b: BookingInfo, driverId: string, start: number) =>
  shipment(
    n, b, driverId, "COMPLETED", start + 4,
    [
      milestone(`${n}-m1`, "PICKUP_CONFIRMED", at(start, 7), b.from, "Driver arrived and pickup confirmed.", b.ownerId),
      milestone(`${n}-m2`, "LOADED", at(start, 9), b.from, "Cargo loaded and sealed.", b.ownerId),
      milestone(`${n}-m3`, "DEPARTED", at(start, 11), b.from, "Departed on schedule.", b.ownerId),
      milestone(`${n}-m4`, "ARRIVED", at(start + 3, 14), b.to, "Arrived at the delivery point.", b.ownerId),
      milestone(`${n}-m5`, "DELIVERED", at(start + 3, 17), b.to, "Delivered and signed for.", b.ownerId),
    ],
    { evidence: evidence(b.ownerId, at(start + 3, 17), "Receiving clerk", "VERIFIED", { verifiedAt: at(start + 4, 10) }) },
  );

export const shipments: Shipment[] = [
  shipment("2", b2, "d5", "DELAYED", 1, [
    milestone("sh2-m1", "PICKUP_CONFIRMED", at(-13, 6), "Musanze", "Pickup confirmed at the packing house.", b2.ownerId),
    milestone("sh2-m2", "LOADED", at(-13, 8), "Musanze", "Pallets loaded, reefer set to 4 degrees.", b2.ownerId),
    milestone("sh2-m3", "DEPARTED", at(-13, 9), "Musanze", "Departed towards Gatuna border.", b2.ownerId),
    milestone("sh2-m4", "DELAY", at(-12, 11), "Gatuna border", "Waiting in the clearance queue.", b2.ownerId),
  ], { delay: { reason: "Border clearance queue at Gatuna", newEtaDate: day(1), reportedAt: at(-12, 11) } }),

  shipment("3", b3, "d7", "DELIVERED", -13, [
    milestone("sh3-m1", "PICKUP_CONFIRMED", at(-15, 7), "Kigali", "Pickup confirmed.", b3.ownerId),
    milestone("sh3-m2", "LOADED", at(-15, 9), "Kigali", "Cargo loaded.", b3.ownerId),
    milestone("sh3-m3", "DEPARTED", at(-15, 10), "Kigali", "Departed.", b3.ownerId),
    milestone("sh3-m4", "DELIVERED", at(-14, 15), "Rusumo", "Delivered. Receiver reported broken tiles.", b3.ownerId),
  ], {
    evidence: evidence(b3.ownerId, at(-14, 15), "Innocent Ndayambaje", "SUBMITTED", {
      notes: "Three crates arrived opened. About 40 tiles are broken.", damage: true,
    }),
    settlementHold: "Open dispute DSP-2026-0001 holds this settlement.",
  }),

  completed("4", b4, "d6", -60),

  shipment("5", b5, "d2", "DELIVERED", -12, [
    milestone("sh5-m1", "PICKUP_CONFIRMED", at(-16, 7), "Nairobi", "Gate pass checked.", b5.ownerId),
    milestone("sh5-m2", "LOADED", at(-16, 9), "Nairobi", "Loaded and sealed.", b5.ownerId),
    milestone("sh5-m3", "DEPARTED", at(-16, 11), "Nairobi", "Departed.", b5.ownerId),
    milestone("sh5-m4", "ARRIVED", at(-13, 13), "Kigali", "Arrived at the Nyabugogo logistics park.", b5.ownerId),
    milestone("sh5-m5", "DELIVERED", at(-13, 16), "Kigali", "Unloaded and signed.", b5.ownerId),
  ], { evidence: evidence(b5.ownerId, at(-13, 16), "David Okello", "SUBMITTED") }),

  shipment("6", b6, "d1", "IN_TRANSIT", 2, [
    milestone("sh6-m1", "PICKUP_CONFIRMED", at(-4, 6), "Kigali", "Pickup confirmed at Kicukiro.", b6.ownerId),
    milestone("sh6-m2", "LOADED", at(-4, 8), "Kigali", "Cargo loaded and strapped.", b6.ownerId),
    milestone("sh6-m3", "DEPARTED", at(-4, 9), "Kigali", "Departed towards Rusumo.", b6.ownerId),
    milestone("sh6-m4", "IN_TRANSIT_UPDATE", at(-3, 12), "Rusumo", "Crossed the border and continuing to Mombasa.", b6.ownerId),
  ], { settlementHold: "Open incident INC-2026-0001 holds this settlement." }),

  completed("g5", g5, "d1", -75),
  completed("g12", g12, "d2", -70),
  completed("a5", a5, "d6", -66),
  completed("g19", g19, "d1", -58),
  completed("g26", g26, "d2", -52),
];

/* ---------------------------------------------------------------- settlements & payouts */

function settlement(
  n: number,
  b: BookingInfo,
  shipmentId: string | undefined,
  status: SettlementStatus,
  extra: Partial<Settlement> = {},
): Settlement {
  const shares = paymentShares(b.amount);
  const deductionsRwf = extra.deductionsRwf ?? 0;
  const adjustmentsRwf = extra.adjustmentsRwf ?? 0;
  const history: SettlementHistoryEntry[] = [
    { at: at(-30), status: "AWAITING_DELIVERY", actor: "System", note: "Settlement created when the payment was held." },
    ...(extra.history ?? []),
  ];
  return {
    id: `st${n}`,
    ref: ref("STL", n),
    bookingId: b.bookingId,
    shipmentId,
    ownerId: b.ownerId,
    agreedAmountRwf: shares.amountRwf,
    platformFeeRwf: shares.commissionRwf,
    deductionsRwf,
    adjustmentsRwf,
    netAmountRwf: Math.max(0, shares.ownerAmountRwf - deductionsRwf + adjustmentsRwf),
    status,
    createdAt: at(-30),
    ...extra,
    history,
  };
}

export const settlements: Settlement[] = [
  settlement(1, b2, "sh2", "AWAITING_DELIVERY"),
  settlement(2, b3, "sh3", "ON_HOLD", { holdReason: "Open dispute DSP-2026-0001" }),
  settlement(3, b4, "sh4", "PAID", {
    payoutId: "p1", payoutRef: "PAY-2026-0001", processedAt: at(-52, 9), paidAt: at(-52, 10),
    history: [
      { at: at(-55), status: "ELIGIBLE", actor: "Claire Mugisha", note: "Delivery verified; no holds." },
      { at: at(-52, 9), status: "PROCESSING", actor: "Solange Uwimana", note: "Payout started (simulated)." },
      { at: at(-52, 10), status: "PAID", actor: "System", note: "Payout recorded as paid (simulated)." },
    ],
  }),
  settlement(4, b5, "sh5", "AWAITING_VERIFICATION"),
  settlement(5, b6, "sh6", "ON_HOLD", { holdReason: "Open incident INC-2026-0001" }),
  settlement(6, g5, "shg5", "ELIGIBLE", {
    history: [{ at: at(-70), status: "ELIGIBLE", actor: "Claire Mugisha", note: "Delivery verified; no holds." }],
  }),
  settlement(7, g12, "shg12", "FAILED", {
    payoutId: "p2", payoutRef: "PAY-2026-0002", processedAt: at(-64, 9), failureReason: "The mobile money number was rejected by the provider (simulated failure).",
    history: [
      { at: at(-66), status: "ELIGIBLE", actor: "Claire Mugisha", note: "Delivery verified; no holds." },
      { at: at(-64, 9), status: "PROCESSING", actor: "Solange Uwimana", note: "Payout started (simulated)." },
      { at: at(-64, 10), status: "FAILED", actor: "System", note: "Payout failed (simulated): destination rejected." },
    ],
  }),
  settlement(8, a5, "sha5", "PAID", {
    payoutId: "p4", payoutRef: "PAY-2026-0004", processedAt: at(-60, 9), paidAt: at(-60, 10),
    history: [{ at: at(-60, 10), status: "PAID", actor: "System", note: "Payout recorded as paid (simulated)." }],
  }),
  settlement(9, g19, "shg19", "REVERSED", {
    adjustmentsRwf: -50_000, deductionNote: "Agreed compensation for delayed delivery (dispute decision).",
    history: [
      { at: at(-50), status: "PAID", actor: "System", note: "Payout recorded as paid (simulated)." },
      { at: at(-44), status: "REVERSED", actor: "Solange Uwimana", note: "RWF 50,000 adjusted after a dispute decision (simulated)." },
    ],
  }),
  settlement(10, g26, "shg26", "PROCESSING", {
    payoutId: "p3", payoutRef: "PAY-2026-0003", processedAt: at(-1, 9),
    history: [{ at: at(-1, 9), status: "PROCESSING", actor: "Solange Uwimana", note: "Payout started (simulated)." }],
  }),
];

export const payouts: Payout[] = [
  { id: "p1", ref: "PAY-2026-0001", ownerId: b4.ownerId, settlementIds: ["st3"], amountRwf: settlements[2].netAmountRwf, method: "MOBILE_MONEY", destination: "MTN MoMo +254 722 ••• 018", status: "PAID", createdAt: at(-52, 9), paidAt: at(-52, 10) },
  { id: "p2", ref: "PAY-2026-0002", ownerId: g12.ownerId, settlementIds: ["st7"], amountRwf: settlements[6].netAmountRwf, method: "MOBILE_MONEY", destination: "MTN MoMo +250 789 ••• 112", status: "FAILED", failureReason: "The mobile money number was rejected by the provider (simulated failure).", createdAt: at(-64, 9) },
  { id: "p3", ref: "PAY-2026-0003", ownerId: g26.ownerId, settlementIds: ["st10"], amountRwf: settlements[9].netAmountRwf, method: "BANK", destination: "Bank of Kigali •••• 4471", status: "PROCESSING", createdAt: at(-1, 9) },
  { id: "p4", ref: "PAY-2026-0004", ownerId: a5.ownerId, settlementIds: ["st8"], amountRwf: settlements[7].netAmountRwf, method: "BANK", destination: "Equity Bank •••• 2208", status: "PAID", createdAt: at(-60, 9), paidAt: at(-60, 10) },
];
