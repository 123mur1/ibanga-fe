import { evaluateSettlement, netPayable } from "@/config/business-rules";
import type { Payout, Settlement, Shipment, ShipmentMilestone, ShipmentStatus } from "@/types/ops";
import type { SettlementService, ShipmentService } from "../contracts";
import type { Actor } from "../types";
import { findBooking, findUser } from "./directory";
import { ensureRecords, openDisputeFor, openIncidentFor } from "./sync";
import { audit, commit, conflict, db, delay, forbid, invalid, newId, nextRef, notFound, notification, nowIso, queryList, replaceById, requirePermission } from "./util";

/* ------------------------------------------------------------------ shipments */

const NEXT_ALLOWED: Record<string, ShipmentStatus[]> = {
  SCHEDULED: ["PICKUP_CONFIRMED"],
  PICKUP_CONFIRMED: ["LOADED"],
  LOADED: ["DEPARTED"],
  DEPARTED: ["IN_TRANSIT", "ARRIVED"],
  IN_TRANSIT: ["IN_TRANSIT", "ARRIVED"],
  DELAYED: ["IN_TRANSIT", "ARRIVED"],
  ARRIVED: ["UNLOADING"],
};

const MILESTONE_STATUS: Record<string, ShipmentStatus | undefined> = {
  PICKUP_CONFIRMED: "PICKUP_CONFIRMED",
  LOADED: "LOADED",
  DEPARTED: "DEPARTED",
  IN_TRANSIT_UPDATE: "IN_TRANSIT",
  ARRIVED: "ARRIVED",
  UNLOADING: "UNLOADING",
};

function scoped(actor: Actor, shipments: Shipment[]): Shipment[] {
  if (actor.role === "ADMIN") return shipments;
  if (actor.role === "IMPORTER") return shipments.filter((item) => item.importerId === actor.id);
  if (actor.role === "DRIVER") {
    const driver = db().drivers.find((item) => item.userId === actor.id);
    return driver ? shipments.filter((item) => item.driverId === driver.id) : [];
  }
  return shipments.filter((item) => item.ownerId === actor.id);
}

function find(actor: Actor, id: string): Shipment {
  const shipment = db().shipments.find((item) => item.id === id);
  if (!shipment) notFound("Shipment");
  if (!scoped(actor, [shipment]).length) forbid();
  return shipment;
}

function operate(actor: Actor, id: string): Shipment {
  const shipment = find(actor, id);
  if (actor.role === "IMPORTER") forbid("Only the truck owner or an administrator can update a shipment.");
  if (actor.role === "DRIVER" && !scoped(actor, [shipment]).length) forbid("You can only update a shipment assigned to you.");
  return shipment;
}

export const shipmentService: ShipmentService = {
  async list(actor, query) {
    await delay(200);
    return queryList(scoped(actor, db().shipments), { sort: { field: "createdAt", direction: "desc" }, ...query }, (item) => {
      const booking = findBooking(item.bookingId);
      return `${item.ref} ${item.status} ${booking?.pickupLocation ?? ""} ${booking?.destination ?? ""} ${booking?.cargoType ?? ""}`;
    });
  },

  async get(actor, id) {
    await delay(120);
    return find(actor, id);
  },

  async getByBooking(actor, bookingId) {
    await delay(100);
    return scoped(actor, db().shipments).find((item) => item.bookingId === bookingId);
  },

  async recordMilestone(actor, id, input) {
    await delay();
    const shipment = operate(actor, id);
    if (input.kind === "DELIVERED") {
      invalid("Delivery is recorded by submitting delivery evidence, not by changing a status.");
    }
    if (input.kind === "DELAY") invalid("Use the delay form to report a delay.");
    const next = MILESTONE_STATUS[input.kind];
    if (!next) invalid("Unknown milestone.");
    const allowed = NEXT_ALLOWED[shipment.status] ?? [];
    if (!allowed.includes(next)) invalid(`A shipment that is "${shipment.status.replaceAll("_", " ").toLowerCase()}" cannot move to "${next.replaceAll("_", " ").toLowerCase()}".`);
    const booking = findBooking(shipment.bookingId);
    if (["LOADED", "DEPARTED"].includes(next) && !(booking?.payment && ["FUNDED", "HELD"].includes(booking.payment.status))) {
      conflict("The importer's payment has not been confirmed, so the shipment cannot depart yet.");
    }
    if (!input.place.trim()) invalid("Enter where the truck is.", { place: "Enter a location." });
    const milestone: ShipmentMilestone = {
      id: newId("ms"), kind: input.kind, at: nowIso(), place: input.place.trim(), note: input.note.trim(), recordedBy: actor.id, simulated: true,
    };
    const updated: Shipment = { ...shipment, status: next, milestones: [...shipment.milestones, milestone], delay: next === "IN_TRANSIT" ? undefined : shipment.delay };
    commit((current) => ({ ...current, shipments: replaceById(current.shipments, id, () => updated) }), {
      audit: [audit(actor, "Recorded milestone (simulated)", "Shipment", shipment.ref, `${input.kind}: ${input.place}`)],
      notifications: [notification(
        shipment.importerId,
        "SHIPMENT",
        input.kind === "DEPARTED" ? "Cargo departed from pickup" : `Shipment ${next.replaceAll("_", " ").toLowerCase()}`,
        input.kind === "DEPARTED"
          ? `${shipment.ref} has left ${input.place.trim()}${input.note.trim() ? `. ${input.note.trim()}` : ". Track the shipment for progress updates."}`
          : `${shipment.ref}: ${input.note.trim() || input.place}`,
        `/dashboard/importer/shipments/${id}`,
      )],
    });
    return updated;
  },

  async reportDelay(actor, id, input) {
    await delay();
    const shipment = operate(actor, id);
    if (!["DEPARTED", "IN_TRANSIT", "DELAYED"].includes(shipment.status)) conflict("Only a shipment on the road can be delayed.");
    if (input.reason.trim().length < 5) invalid("Explain the delay in a few words.", { reason: "Enter a reason." });
    if (!input.newEtaDate) invalid("Enter the new estimated delivery date.", { newEtaDate: "Choose a date." });
    const milestone: ShipmentMilestone = { id: newId("ms"), kind: "DELAY", at: nowIso(), place: "On route", note: input.reason.trim(), recordedBy: actor.id, simulated: true };
    const updated: Shipment = {
      ...shipment, status: "DELAYED", etaDate: input.newEtaDate, milestones: [...shipment.milestones, milestone],
      delay: { reason: input.reason.trim(), newEtaDate: input.newEtaDate, reportedAt: nowIso() },
    };
    commit((current) => ({ ...current, shipments: replaceById(current.shipments, id, () => updated) }), {
      audit: [audit(actor, "Reported delay", "Shipment", shipment.ref, input.reason.trim())],
      notifications: [notification(shipment.importerId, "SHIPMENT", "Shipment delayed", `${shipment.ref} is delayed: ${input.reason.trim()}. New estimate ${input.newEtaDate}.`, `/dashboard/importer/shipments/${id}`)],
    });
    return updated;
  },

  async submitEvidence(actor, id, input) {
    await delay();
    const shipment = operate(actor, id);
    if (actor.role === "ADMIN") forbid("Delivery evidence is submitted by the truck owner or driver.");
    const resubmitting = shipment.evidence?.verification === "REJECTED";
    if (!["ARRIVED", "UNLOADING"].includes(shipment.status) && !resubmitting) conflict("Evidence can be submitted once the shipment has arrived.");
    const errors: Record<string, string> = {};
    if (!input.recipientName.trim()) errors.recipientName = "Enter who received the cargo.";
    if (!input.confirmationCode.trim()) errors.confirmationCode = "Enter the delivery confirmation code.";
    if (!input.photos.length) errors.photos = "Add at least one delivery photo.";
    if (!input.deliveredAt) errors.deliveredAt = "Enter when the cargo was delivered.";
    if ((input.damageReported || input.shortageReported) && input.notes.trim().length < 5) errors.notes = "Describe the damage or shortage.";
    if (Object.keys(errors).length) invalid("Complete the delivery evidence before submitting.", errors);
    const milestone: ShipmentMilestone = { id: newId("ms"), kind: "DELIVERED", at: nowIso(), place: findBooking(shipment.bookingId)?.destination ?? "Destination", note: "Delivery evidence submitted. Awaiting verification.", recordedBy: actor.id, simulated: false };
    const updated: Shipment = {
      ...shipment,
      status: "DELIVERED",
      milestones: [...shipment.milestones, milestone],
      evidence: { ...input, submittedAt: nowIso(), submittedBy: actor.id, verification: "SUBMITTED" },
    };
    commit((current) => ({ ...current, shipments: replaceById(current.shipments, id, () => updated) }), {
      audit: [audit(actor, "Submitted delivery evidence", "Shipment", shipment.ref, `Recipient ${input.recipientName}`)],
      notifications: [
        notification(shipment.importerId, "DELIVERY", "Delivery evidence submitted", `${shipment.ref}: the driver submitted proof of delivery. It is not verified until an administrator reviews it.`, `/dashboard/importer/shipments/${id}`),
        ...db().adminProfiles.filter((profile) => profile.permissions.includes("shipments")).map((profile) =>
          notification(profile.userId, "DELIVERY", "Delivery evidence to verify", `${shipment.ref} is waiting for delivery verification.`, `/dashboard/admin/shipments/${id}`)),
      ],
    });
    return updated;
  },

  async reviewEvidence(actor, id, input) {
    await delay();
    requirePermission(actor, "shipments");
    const shipment = db().shipments.find((item) => item.id === id);
    if (!shipment) notFound("Shipment");
    if (!shipment.evidence || shipment.evidence.verification !== "SUBMITTED") conflict("There is no submitted evidence waiting for review.");
    if (!input.approve && (input.reason ?? "").trim().length < 5) invalid("Give the owner a reason for rejecting the evidence.", { reason: "Enter a reason." });
    const evidence = {
      ...shipment.evidence,
      verification: input.approve ? ("VERIFIED" as const) : ("REJECTED" as const),
      verifiedAt: nowIso(),
      verifiedBy: actor.id,
      rejectionReason: input.approve ? undefined : input.reason?.trim(),
    };
    const updated: Shipment = { ...shipment, evidence, status: input.approve ? "COMPLETED" : "UNLOADING" };
    commit((current) => ({ ...current, shipments: replaceById(current.shipments, id, () => updated) }), {
      audit: [audit(actor, input.approve ? "Verified delivery" : "Rejected delivery evidence", "Shipment", shipment.ref, input.reason?.trim() ?? "")],
      notifications: [
        notification(shipment.ownerId, "DELIVERY", input.approve ? "Delivery verified" : "Delivery evidence rejected", input.approve ? `${shipment.ref} was verified. Your settlement can now be processed.` : `${shipment.ref}: ${input.reason?.trim()}. Please resubmit.`, `/dashboard/owner/shipments/${id}`),
        notification(shipment.importerId, "DELIVERY", input.approve ? "Delivery verified" : "Delivery under review", `${shipment.ref} ${input.approve ? "was verified by iBanga." : "needs updated evidence from the truck owner."}`, `/dashboard/importer/shipments/${id}`),
      ],
    });
    return updated;
  },

  async syncFromBookings(bookings) {
    commit((current) => ensureRecords(current, bookings));
  },
};

/* ------------------------------------------------------------------ settlements */

function settlementScope(actor: Actor, settlements: Settlement[]): Settlement[] {
  if (actor.role === "ADMIN") return settlements;
  if (actor.role === "TRUCK_OWNER") return settlements.filter((item) => item.ownerId === actor.id);
  return settlements.filter((item) => findBooking(item.bookingId)?.importerId === actor.id);
}

function loadSettlement(actor: Actor, id: string): Settlement {
  const settlement = db().settlements.find((item) => item.id === id);
  if (!settlement) notFound("Settlement");
  if (!settlementScope(actor, [settlement]).length) forbid();
  return settlement;
}

function admin(actor: Actor) {
  requirePermission(actor, "settlements");
}

function entry(actor: Actor, status: Settlement["status"], note: string) {
  return { at: nowIso(), status, actor: actor.name, note };
}

function save(actor: Actor, settlement: Settlement, action: string, extra: { payouts?: Payout[] } = {}) {
  commit(
    (current) => ({
      ...current,
      settlements: replaceById(current.settlements, settlement.id, () => settlement),
      payouts: extra.payouts ? [...extra.payouts, ...current.payouts.filter((p) => !extra.payouts?.some((n) => n.id === p.id))] : current.payouts,
    }),
    { audit: [audit(actor, action, "Settlement", settlement.ref, settlement.status)] },
  );
}

export const settlementService: SettlementService = {
  async list(actor, query) {
    await delay(200);
    return queryList(settlementScope(actor, db().settlements), { sort: { field: "createdAt", direction: "desc" }, ...query }, (item) => `${item.ref} ${item.bookingId} ${item.status} ${item.payoutRef ?? ""}`);
  },

  async get(actor, id) {
    await delay(120);
    return loadSettlement(actor, id);
  },

  async syncEligibility(bookings) {
    commit((current) => ensureRecords(current, bookings));
  },

  async approve(actor, id) {
    await delay();
    admin(actor);
    const settlement = loadSettlement(actor, id);
    const booking = findBooking(settlement.bookingId);
    const shipment = db().shipments.find((item) => item.bookingId === settlement.bookingId);
    if (settlement.status !== "ELIGIBLE") conflict(`This settlement is "${settlement.status.replaceAll("_", " ").toLowerCase()}" and cannot be approved.`);
    // Re-check the rules at approval time. The backend must do this inside the payout transaction.
    if (booking) {
      const check = evaluateSettlement({ booking, shipment, openDispute: openDisputeFor(db(), booking.id), openIncident: openIncidentFor(db(), shipment?.id) });
      if (check.status !== "ELIGIBLE") conflict(check.reasons[0]);
    }
    if (settlement.payoutId) conflict("A payout already exists for this settlement.");
    const data = db();
    const payout: Payout = {
      id: newId("p"), ref: nextRef("PAY", data.payouts), ownerId: settlement.ownerId, settlementIds: [settlement.id], amountRwf: settlement.netAmountRwf,
      method: "MOBILE_MONEY", destination: `Owner payout account on file (${findUser(settlement.ownerId)?.phone ?? "—"})`, status: "PROCESSING", createdAt: nowIso(),
    };
    const updated: Settlement = {
      ...settlement, status: "PROCESSING", payoutId: payout.id, payoutRef: payout.ref, processedAt: nowIso(),
      history: [...settlement.history, entry(actor, "PROCESSING", "Payout started (simulated). No money moved.")],
    };
    save(actor, updated, "Approved settlement", { payouts: [payout] });
    return updated;
  },

  async completePayout(actor, id, outcome, failureReason) {
    await delay();
    admin(actor);
    const settlement = loadSettlement(actor, id);
    if (settlement.status !== "PROCESSING") conflict("Only a processing settlement can receive a payout result.");
    if (outcome === "FAILED" && !(failureReason ?? "").trim()) invalid("Add the failure reason.", { failureReason: "Enter a reason." });
    const updated: Settlement = {
      ...settlement,
      status: outcome,
      paidAt: outcome === "PAID" ? nowIso() : undefined,
      failureReason: outcome === "FAILED" ? failureReason?.trim() : undefined,
      history: [...settlement.history, entry(actor, outcome, outcome === "PAID" ? "Payout recorded as paid (simulated)." : `Payout failed (simulated): ${failureReason?.trim()}`)],
    };
    commit(
      (current) => ({
        ...current,
        settlements: replaceById(current.settlements, id, () => updated),
        payouts: current.payouts.map((payout) => (payout.id === settlement.payoutId
          ? { ...payout, status: outcome, paidAt: outcome === "PAID" ? nowIso() : undefined, failureReason: outcome === "FAILED" ? failureReason?.trim() : undefined }
          : payout)),
      }),
      {
        audit: [audit(actor, outcome === "PAID" ? "Marked payout paid (simulated)" : "Marked payout failed (simulated)", "Settlement", settlement.ref, failureReason ?? "")],
        notifications: [notification(settlement.ownerId, "SETTLEMENT", outcome === "PAID" ? "Settlement paid" : "Payout failed", outcome === "PAID" ? `${settlement.ref} was paid (simulated).` : `${settlement.ref} failed: ${failureReason?.trim()}.`, "/dashboard/owner/earnings")],
      },
    );
    return updated;
  },

  async retryPayout(actor, id) {
    await delay();
    admin(actor);
    const settlement = loadSettlement(actor, id);
    if (settlement.status !== "FAILED") conflict("Only failed payouts can be retried.");
    const updated: Settlement = { ...settlement, status: "PROCESSING", failureReason: undefined, processedAt: nowIso(), history: [...settlement.history, entry(actor, "PROCESSING", "Payout retried (simulated).")] };
    commit(
      (current) => ({
        ...current,
        settlements: replaceById(current.settlements, id, () => updated),
        payouts: current.payouts.map((payout) => (payout.id === settlement.payoutId ? { ...payout, status: "PROCESSING", failureReason: undefined } : payout)),
      }),
      { audit: [audit(actor, "Retried payout (simulated)", "Settlement", settlement.ref, "")] },
    );
    return updated;
  },

  async hold(actor, id, reason) {
    await delay();
    admin(actor);
    const settlement = loadSettlement(actor, id);
    if (["PAID", "PROCESSING"].includes(settlement.status)) conflict("A payout is already in progress or complete.");
    if (reason.trim().length < 5) invalid("Give a reason for the hold.", { reason: "Enter a reason." });
    const updated: Settlement = { ...settlement, status: "ON_HOLD", holdReason: `Admin hold: ${reason.trim()}`, history: [...settlement.history, entry(actor, "ON_HOLD", `Admin hold: ${reason.trim()}`)] };
    save(actor, updated, "Placed settlement on hold");
    return updated;
  },

  async releaseHold(actor, id) {
    await delay();
    admin(actor);
    const settlement = loadSettlement(actor, id);
    if (settlement.status !== "ON_HOLD") conflict("This settlement is not on hold.");
    const updated: Settlement = { ...settlement, holdReason: undefined, history: [...settlement.history, entry(actor, "ON_HOLD", "Admin hold released; eligibility will be re-checked.")] };
    save(actor, updated, "Released settlement hold");
    return updated;
  },

  async addAdjustment(actor, id, input) {
    await delay();
    admin(actor);
    const settlement = loadSettlement(actor, id);
    if (!Number.isFinite(input.amountRwf) || input.amountRwf === 0) invalid("Enter a non-zero adjustment.", { amountRwf: "Enter an amount." });
    if (input.note.trim().length < 5) invalid("Explain the adjustment.", { note: "Enter a note." });
    const adjustmentsRwf = settlement.adjustmentsRwf + input.amountRwf;
    const status: Settlement["status"] = settlement.status === "PAID" ? "REVERSED" : settlement.status;
    const updated: Settlement = {
      ...settlement, adjustmentsRwf, status, deductionNote: input.note.trim(),
      netAmountRwf: netPayable(settlement.agreedAmountRwf, settlement.platformFeeRwf, settlement.deductionsRwf, adjustmentsRwf),
      history: [...settlement.history, entry(actor, status, `Adjustment of RWF ${input.amountRwf.toLocaleString("en-RW")}: ${input.note.trim()} (simulated).`)],
    };
    save(actor, updated, "Adjusted settlement");
    return updated;
  },

  async listPayouts(actor, query) {
    await delay(150);
    const scopedPayouts = db().payouts.filter((payout) => actor.role === "ADMIN" || payout.ownerId === actor.id);
    return queryList(scopedPayouts, { sort: { field: "createdAt", direction: "desc" }, ...query }, (payout) => `${payout.ref} ${payout.status} ${payout.destination}`);
  },
};
