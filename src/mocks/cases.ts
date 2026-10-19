/** Demonstration cancellations, disputes, incidents, insurance claims and support tickets. SAMPLE DATA. */
import { calculateCancellation } from "@/config/business-rules";
import type { CancellationRequest, DisputeCase, Incident, InsuranceClaim, SupportTicket } from "@/types/ops";
import { at, ref, sampleFile } from "./helpers";

export const cancellations: CancellationRequest[] = [
  (() => {
    const outcome = calculateCancellation("AFTER_PICKUP", 850_000);
    return {
      id: "cx1", ref: ref("CXL", 1), bookingId: "b2", requestedBy: "u-importer", requesterRole: "IMPORTER" as const,
      reason: "Cargo no longer needed", details: "The buyer cancelled the order, so the avocados cannot be received. We understand the pickup fee applies.",
      stage: outcome.stage, paidAmountRwf: outcome.paidAmountRwf, feeRwf: outcome.feeRwf, refundRwf: outcome.refundRwf,
      status: "REQUESTED" as const, createdAt: at(-1, 15),
    };
  })(),
  (() => {
    const outcome = calculateCancellation("BEFORE_PAYMENT", 0);
    return {
      id: "cx2", ref: ref("CXL", 2), bookingId: "booking-u-owner-7", requestedBy: "u-importer-7", requesterRole: "IMPORTER" as const,
      reason: "Found a closer truck", details: "Booked before payment, no money taken.",
      stage: outcome.stage, paidAmountRwf: 0, feeRwf: 0, refundRwf: 0,
      status: "COMPLETED" as const, reviewedBy: "u-admin-ops", reviewNote: "Cancelled before payment. No fee.", createdAt: at(-20, 10), resolvedAt: at(-20, 11),
    };
  })(),
  (() => {
    const outcome = calculateCancellation("AFTER_PAYMENT", 740_000);
    return {
      id: "cx3", ref: ref("CXL", 3), bookingId: "b1", requestedBy: "u-importer", requesterRole: "IMPORTER" as const,
      reason: "Shipment rescheduled", details: "The shipping line moved our container to next week.",
      stage: outcome.stage, paidAmountRwf: outcome.paidAmountRwf, feeRwf: outcome.feeRwf, refundRwf: outcome.refundRwf,
      status: "REJECTED" as const, reviewedBy: "u-admin-fin", reviewNote: "Pickup is within 48 hours and the truck is already reserved. Please reschedule instead.", createdAt: at(-6, 9), resolvedAt: at(-5, 12),
    };
  })(),
];

const evidenceFile = (name: string) => ({ name, url: sampleFile(name, "Evidence file (sample)") });

export const disputeCases: DisputeCase[] = [
  {
    id: "dc1", ref: ref("DSP", 1), raisedBy: "u-importer-2", raisedByRole: "IMPORTER", againstUserId: "u-owner-2", bookingId: "b3", shipmentId: "sh3",
    paymentRef: "IB-B3", category: "DAMAGED_CARGO",
    description: "Three crates arrived opened and about 40 tiles were broken. The seals on the delivery note do not match.",
    evidence: [evidenceFile("Broken tiles photo.jpg"), evidenceFile("Delivery note.pdf")],
    status: "UNDER_REVIEW", assignedTo: "u-admin-sup",
    notes: [
      { id: "dc1-n1", at: at(-12, 10), by: "u-admin-sup", text: "Requested delivery photos from the driver. Settlement placed on hold.", internal: true },
      { id: "dc1-n2", at: at(-11, 14), by: "u-admin-sup", text: "Driver confirms crates were already opened when loaded at Kigali.", internal: true },
    ],
    messages: [
      { id: "dc1-m1", at: at(-13, 9), by: "u-importer-2", text: "Please see the attached photos. The seals were broken on arrival." },
      { id: "dc1-m2", at: at(-12, 9), by: "u-owner-2", text: "The crates were damaged before loading. We have photos from the pickup." },
    ],
    proposedResolution: "Partial compensation of RWF 60,000 pending the pickup photos.",
    createdAt: at(-14, 9), updatedAt: at(-11, 14),
  },
  {
    id: "dc2", ref: ref("DSP", 2), raisedBy: "u-importer", raisedByRole: "IMPORTER", againstUserId: "u-owner-2", bookingId: "b2", shipmentId: "sh2",
    paymentRef: "IB-B2", category: "LATE_DELIVERY",
    description: "The shipment is more than a week past its expected delivery date and perishables are at risk.",
    evidence: [evidenceFile("Booking confirmation.pdf")], status: "OPEN", notes: [],
    messages: [{ id: "dc2-m1", at: at(-2, 8), by: "u-importer", text: "Can you confirm a new delivery time? The cold store is waiting." }],
    createdAt: at(-2, 8), updatedAt: at(-2, 8),
  },
  {
    id: "dc3", ref: ref("DSP", 3), raisedBy: "u-owner", raisedByRole: "TRUCK_OWNER", againstUserId: "u-importer-2", bookingId: "b5", shipmentId: "sh5",
    paymentRef: "IB-B5", category: "PAYMENT_ISSUE",
    description: "The importer has not confirmed receipt although the cargo was delivered and signed for.",
    evidence: [evidenceFile("Signed delivery note.pdf")], status: "AWAITING_INFO", assignedTo: "u-admin-fin",
    notes: [{ id: "dc3-n1", at: at(-9, 11), by: "u-admin-fin", text: "Asked the importer to confirm whether the goods were received in full.", internal: true }],
    messages: [{ id: "dc3-m1", at: at(-9, 11), by: "u-admin-fin", text: "Please confirm whether the cargo was received in full and in good condition." }],
    infoRequest: "Importer: confirm receipt status and any shortages.", createdAt: at(-10, 9), updatedAt: at(-9, 11),
  },
  {
    id: "dc4", ref: ref("DSP", 4), raisedBy: "u-importer", raisedByRole: "IMPORTER", againstUserId: "u-owner-2", bookingId: "b4", shipmentId: "sh4",
    paymentRef: "IB-B4", category: "OVERCHARGE", description: "An extra fuel surcharge was requested at delivery that is not in the agreed price.",
    evidence: [], status: "RESOLVED", assignedTo: "u-admin-sup",
    notes: [{ id: "dc4-n1", at: at(-50, 10), by: "u-admin-sup", text: "Surcharge was not in the booking terms.", internal: true }],
    messages: [{ id: "dc4-m1", at: at(-51, 9), by: "u-importer", text: "The driver asked for RWF 50,000 extra at the destination." }],
    decision: { type: "PARTIAL_REFUND", amountRwf: 50_000, note: "Surcharge was not agreed. Compensation recorded for a refund review.", at: at(-48, 12), by: "u-admin-sup" },
    createdAt: at(-52, 9), updatedAt: at(-48, 12), resolvedAt: at(-48, 12),
  },
  {
    id: "dc5", ref: ref("DSP", 5), raisedBy: "u-importer-2", raisedByRole: "IMPORTER", againstUserId: "u-owner-2", bookingId: "b3", paymentRef: "IB-B3",
    category: "MISSING_CARGO", description: "Two pallets listed on the packing list were not on the truck.",
    evidence: [evidenceFile("Packing list.pdf")], status: "ESCALATED", assignedTo: "u-admin",
    notes: [{ id: "dc5-n1", at: at(-7, 9), by: "u-admin", text: "Escalated because the value exceeds the support team's limit.", internal: true }],
    messages: [], createdAt: at(-8, 10), updatedAt: at(-7, 9),
  },
];

export const incidents: Incident[] = [
  {
    id: "inc1", ref: ref("INC", 1), reportedBy: "u-owner", shipmentId: "sh6", truckId: "truck-u-owner-1", driverId: "d1", type: "BREAKDOWN",
    severity: "HIGH", occurredAt: at(-1, 13), location: "Near Rusumo border, Kayonza", description: "The turbocharger failed and the truck stopped on the road shoulder. A recovery mechanic is on the way.",
    peopleInvolved: "Driver Jean Claude Habimana (unhurt).", cargoCondition: "INTACT", evidence: [evidenceFile("Roadside photo.jpg")],
    immediateAction: "Hazard lights on, warning triangles placed, cargo checked and secured.", assistanceNeeded: "Replacement truck for the remaining journey if repairs take more than 24 hours.",
    status: "UNDER_INVESTIGATION",
    timeline: [
      { at: at(-1, 13), text: "Breakdown reported by the owner.", by: "u-owner" },
      { at: at(-1, 15), text: "Administrator contacted the importer about a possible delay.", by: "u-admin-ops" },
    ],
    responsibleParty: "Mechanical failure (no third party)", createdAt: at(-1, 13),
  },
  {
    id: "inc2", ref: ref("INC", 2), reportedBy: "u-owner-2", shipmentId: "sh3", truckId: "t5", driverId: "d7", type: "CARGO_DAMAGE",
    severity: "MEDIUM", occurredAt: at(-14, 12), location: "Rusumo", description: "Receiver reported broken tiles on delivery. Packaging appears to have been insufficient.",
    peopleInvolved: "Driver Peter Otieno, receiver Innocent Ndayambaje.", cargoCondition: "PARTIALLY_DAMAGED", evidence: [evidenceFile("Damaged crates.jpg")],
    immediateAction: "Photographed the cargo and noted it on the delivery note.", assistanceNeeded: "Insurance claim support.",
    status: "CLAIM_FILED", claimId: "cl1",
    timeline: [
      { at: at(-14, 12), text: "Damage reported on delivery.", by: "u-owner-2" },
      { at: at(-13, 10), text: "Insurance claim filed.", by: "u-admin-ops" },
    ],
    responsibleParty: "Under investigation", createdAt: at(-14, 12),
  },
  {
    id: "inc3", ref: ref("INC", 3), reportedBy: "u-owner", shipmentId: "shg5", truckId: "truck-u-owner-5", type: "ACCIDENT",
    severity: "MEDIUM", occurredAt: at(-72, 16), location: "Kigali-Rusumo road, Kayonza", description: "A minor collision with another vehicle at low speed. No injuries and cargo intact.",
    peopleInvolved: "Two drivers, no injuries.", cargoCondition: "INTACT", evidence: [],
    immediateAction: "Police report filed and photos taken.", assistanceNeeded: "None.", status: "RESOLVED", claimId: "cl2",
    timeline: [
      { at: at(-72, 16), text: "Accident reported.", by: "u-owner" },
      { at: at(-65, 10), text: "Insurer approved repair costs (simulated).", by: "u-admin-ops" },
    ],
    responsibleParty: "Other driver", resolution: "Repair costs covered by the third party's insurer (simulated).", createdAt: at(-72, 16),
  },
];

export const insuranceClaims: InsuranceClaim[] = [
  {
    id: "cl1", ref: ref("CLM", 1), incidentId: "inc2", policyId: "pol7", policyNumber: "JUB-KE-2026-770311", provider: "Jubilee Insurance",
    coverageRwf: 45_000_000, claimedAmountRwf: 60_000, status: "SUBMITTED",
    notes: "Claim for broken tiles. Awaiting the provider's assessor.", filedAt: at(-13, 10),
  },
  {
    id: "cl2", ref: ref("CLM", 2), incidentId: "inc3", policyId: "pol10", policyNumber: "SOR-MV-2026-004790", provider: "SORAS Insurance",
    coverageRwf: 42_000_000, claimedAmountRwf: 420_000, status: "PAID_SIMULATED",
    notes: "Repair estimate approved. Paid in the demonstration only.", filedAt: at(-70, 10), decidedAt: at(-65, 10), decisionNote: "Approved in full (simulated).",
  },
];

export const supportTickets: SupportTicket[] = [
  {
    id: "tk1", ref: ref("TKT", 1), createdBy: "u-importer", role: "IMPORTER", subject: "How do I change the pickup date?", category: "BOOKING", priority: "NORMAL", status: "AWAITING_CUSTOMER",
    relatedRef: "b1", assignedTo: "u-admin-sup",
    messages: [
      { id: "tk1-m1", at: at(-5, 9), by: "u-importer", byRole: "IMPORTER", text: "Our container arrives two days later than planned. Can the pickup date be moved?" },
      { id: "tk1-m2", at: at(-4, 11), by: "u-admin-sup", byRole: "ADMIN", text: "Yes, if the truck is free. Which new date works for you?" },
    ],
    createdAt: at(-5, 9), updatedAt: at(-4, 11),
  },
  {
    id: "tk2", ref: ref("TKT", 2), createdBy: "u-owner", role: "TRUCK_OWNER", subject: "Insurance upload keeps failing", category: "TECHNICAL", priority: "HIGH", status: "IN_PROGRESS",
    assignedTo: "u-admin-ops",
    messages: [
      { id: "tk2-m1", at: at(-3, 10), by: "u-owner", byRole: "TRUCK_OWNER", text: "The insurance PDF for RAD 731K will not upload from my phone." },
      { id: "tk2-m2", at: at(-3, 13), by: "u-admin-ops", byRole: "ADMIN", text: "Thanks. Please try a file under 5 MB or email it to us. We are checking the upload." },
    ],
    createdAt: at(-3, 10), updatedAt: at(-3, 13),
  },
  {
    id: "tk3", ref: ref("TKT", 3), createdBy: "u-owner-2", role: "TRUCK_OWNER", subject: "Settlement for booking b4 not received", category: "PAYMENT", priority: "URGENT", status: "RESOLVED",
    relatedRef: "b4", assignedTo: "u-admin-fin",
    messages: [
      { id: "tk3-m1", at: at(-54, 10), by: "u-owner-2", byRole: "TRUCK_OWNER", text: "The delivery was verified last week but we have not been paid." },
      { id: "tk3-m2", at: at(-52, 11), by: "u-admin-fin", byRole: "ADMIN", text: "The payout was processed today (simulated). It should show in your payout history." },
    ],
    createdAt: at(-54, 10), updatedAt: at(-52, 11),
  },
  {
    id: "tk4", ref: ref("TKT", 4), createdBy: "u-importer-2", role: "IMPORTER", subject: "Company verification is taking long", category: "ACCOUNT", priority: "NORMAL", status: "OPEN",
    messages: [{ id: "tk4-m1", at: at(-1, 16), by: "u-importer-2", byRole: "IMPORTER", text: "I uploaded the company registration two days ago. When will it be reviewed?" }],
    createdAt: at(-1, 16), updatedAt: at(-1, 16),
  },
  {
    id: "tk5", ref: ref("TKT", 5), createdBy: "u-owner", role: "TRUCK_OWNER", subject: "Can I add a second driver to one truck?", category: "OTHER", priority: "LOW", status: "CLOSED",
    messages: [
      { id: "tk5-m1", at: at(-30, 9), by: "u-owner", byRole: "TRUCK_OWNER", text: "Can two drivers be assigned to the same truck for long routes?" },
      { id: "tk5-m2", at: at(-29, 9), by: "u-admin-sup", byRole: "ADMIN", text: "One driver is assigned per booking, but you can change drivers between bookings." },
    ],
    createdAt: at(-30, 9), updatedAt: at(-29, 9),
  },
];
