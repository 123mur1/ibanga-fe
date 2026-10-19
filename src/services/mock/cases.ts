import { calculateCancellation } from "@/config/business-rules";
import type { CancellationRequest, DisputeCase, Incident, InsuranceClaim, SupportTicket } from "@/types/ops";
import type { CancellationService, DisputeService, IncidentService, SupportService } from "../contracts";
import type { Actor } from "../types";
import { findBooking, findTruck } from "./directory";
import {
  audit, commit, conflict, db, delay, forbid, invalid, newId, nextRef, notFound, notification, nowIso, queryList, replaceById, requirePermission,
} from "./util";

/* ------------------------------------------------------------------ cancellations */

export const cancellationService: CancellationService = {
  async list(actor, query) {
    await delay(200);
    const all = db().cancellations.filter((item) => actor.role === "ADMIN" || item.requestedBy === actor.id || findBooking(item.bookingId)?.importerId === actor.id);
    return queryList(all, { sort: { field: "createdAt", direction: "desc" }, ...query }, (item) => `${item.ref} ${item.bookingId} ${item.reason} ${item.status}`);
  },

  async request(actor, input) {
    await delay();
    const booking = findBooking(input.bookingId);
    if (!booking) notFound("Booking");
    const truck = findTruck(booking.truckId);
    if (actor.role === "IMPORTER" && booking.importerId !== actor.id) forbid();
    if (actor.role === "TRUCK_OWNER" && truck?.ownerId !== actor.id) forbid();
    if (db().cancellations.some((item) => item.bookingId === booking.id && ["REQUESTED", "APPROVED"].includes(item.status))) {
      conflict("A cancellation request for this booking is already open. No duplicate was created.");
    }
    if (input.reason.trim().length < 3) invalid("Choose or enter a reason.", { reason: "Enter a reason." });
    const outcome = calculateCancellation(input.stage, input.paidAmountRwf);
    const data = db();
    const request: CancellationRequest = {
      id: newId("cx"), ref: nextRef("CXL", data.cancellations), bookingId: booking.id, requestedBy: actor.id, requesterRole: actor.role,
      reason: input.reason.trim(), details: input.details.trim(), stage: outcome.stage, paidAmountRwf: outcome.paidAmountRwf,
      feeRwf: outcome.feeRwf, refundRwf: outcome.refundRwf, status: "REQUESTED", createdAt: nowIso(),
    };
    commit((current) => ({ ...current, cancellations: [request, ...current.cancellations] }), {
      audit: [audit(actor, "Requested cancellation", "Cancellation", request.ref, `${booking.id}: ${input.reason.trim()}`)],
      notifications: data.adminProfiles.filter((profile) => profile.permissions.includes("refunds")).map((profile) =>
        notification(profile.userId, "REFUND", "Cancellation to review", `${request.ref} for booking ${booking.id} is waiting for review.`, "/dashboard/admin/cancellations")),
    });
    return request;
  },

  async review(actor, id, input) {
    await delay();
    requirePermission(actor, "refunds");
    const request = db().cancellations.find((item) => item.id === id);
    if (!request) notFound("Cancellation request");
    if (request.status !== "REQUESTED") conflict("This request has already been reviewed.");
    if (input.note.trim().length < 3) invalid("Add a note for the requester.", { note: "Enter a note." });
    const updated: CancellationRequest = { ...request, status: input.approve ? "APPROVED" : "REJECTED", reviewedBy: actor.id, reviewNote: input.note.trim(), resolvedAt: input.approve ? undefined : nowIso() };
    commit((current) => ({ ...current, cancellations: replaceById(current.cancellations, id, () => updated) }), {
      audit: [audit(actor, input.approve ? "Approved cancellation" : "Rejected cancellation", "Cancellation", request.ref, input.note.trim())],
      notifications: [notification(request.requestedBy, "REFUND", input.approve ? "Cancellation approved" : "Cancellation rejected", `${request.ref}: ${input.note.trim()}`, "/dashboard/importer/refunds")],
    });
    return updated;
  },

  async complete(actor, id) {
    await delay();
    requirePermission(actor, "refunds");
    const request = db().cancellations.find((item) => item.id === id);
    if (!request) notFound("Cancellation request");
    if (request.status !== "APPROVED") conflict("Only approved cancellations can be completed.");
    const updated: CancellationRequest = { ...request, status: "COMPLETED", resolvedAt: nowIso() };
    commit((current) => ({ ...current, cancellations: replaceById(current.cancellations, id, () => updated) }), {
      audit: [audit(actor, "Completed cancellation (simulated refund)", "Cancellation", request.ref, `Refund RWF ${request.refundRwf.toLocaleString("en-RW")}`)],
      notifications: [notification(request.requestedBy, "REFUND", "Cancellation completed", `${request.ref} is complete. Any refund shown is a simulation.`, "/dashboard/importer/refunds")],
    });
    return updated;
  },
};

/* ------------------------------------------------------------------ disputes */

function disputeVisible(actor: Actor, item: DisputeCase) {
  if (actor.role === "ADMIN") return true;
  const booking = findBooking(item.bookingId);
  return item.raisedBy === actor.id || item.againstUserId === actor.id || booking?.importerId === actor.id || (booking ? findTruck(booking.truckId)?.ownerId === actor.id : false);
}

function forActor(actor: Actor, item: DisputeCase): DisputeCase {
  return actor.role === "ADMIN" ? item : { ...item, notes: item.notes.filter((note) => !note.internal) };
}

function loadDispute(actor: Actor, id: string): DisputeCase {
  const found = db().disputeCases.find((item) => item.id === id);
  if (!found) notFound("Dispute");
  if (!disputeVisible(actor, found)) forbid();
  return found;
}

function saveDispute(actor: Actor, dispute: DisputeCase, action: string, detail = "", notify: { userId: string; title: string; body: string }[] = []) {
  commit((current) => ({ ...current, disputeCases: replaceById(current.disputeCases, dispute.id, () => dispute) }), {
    audit: [audit(actor, action, "Dispute", dispute.ref, detail)],
    notifications: notify.map((item) => notification(item.userId, "DISPUTE", item.title, item.body, `/dashboard/${item.userId === dispute.raisedBy ? "importer" : "owner"}/disputes/${dispute.id}`)),
  });
}

export const disputeService: DisputeService = {
  async list(actor, query) {
    await delay(200);
    const scoped = db().disputeCases.filter((item) => disputeVisible(actor, item)).map((item) => forActor(actor, item));
    return queryList(scoped, { sort: { field: "updatedAt", direction: "desc" }, ...query }, (item) => `${item.ref} ${item.bookingId} ${item.category} ${item.status} ${item.description}`);
  },

  async get(actor, id) {
    await delay(120);
    return forActor(actor, loadDispute(actor, id));
  },

  async open(actor, input) {
    await delay();
    if (actor.role === "ADMIN") forbid("Administrators review disputes; importers and owners open them.");
    const booking = findBooking(input.bookingId);
    if (!booking) notFound("Booking");
    const owner = findTruck(booking.truckId)?.ownerId;
    if (actor.role === "IMPORTER" && booking.importerId !== actor.id) forbid();
    if (actor.role === "TRUCK_OWNER" && owner !== actor.id) forbid();
    const errors: Record<string, string> = {};
    if (input.description.trim().length < 20) errors.description = "Describe the problem in at least 20 characters.";
    if (Object.keys(errors).length) invalid("Check the dispute details.", errors);
    const data = db();
    if (data.disputeCases.some((item) => item.bookingId === booking.id && item.raisedBy === actor.id && item.category === input.category && !["RESOLVED", "REJECTED"].includes(item.status))) {
      conflict("You already have an open dispute of this type for this booking.");
    }
    const dispute: DisputeCase = {
      id: newId("dc"), ref: nextRef("DSP", data.disputeCases), raisedBy: actor.id, raisedByRole: actor.role,
      againstUserId: input.againstUserId ?? (actor.role === "IMPORTER" ? owner : booking.importerId), bookingId: booking.id,
      shipmentId: input.shipmentId ?? data.shipments.find((item) => item.bookingId === booking.id)?.id, paymentRef: input.paymentRef,
      category: input.category, description: input.description.trim(), evidence: input.evidence, status: "OPEN", notes: [], messages: [],
      createdAt: nowIso(), updatedAt: nowIso(),
    };
    commit((current) => ({ ...current, disputeCases: [dispute, ...current.disputeCases] }), {
      audit: [audit(actor, "Opened dispute", "Dispute", dispute.ref, input.category)],
      notifications: [
        ...(dispute.againstUserId ? [notification(dispute.againstUserId, "DISPUTE", "Dispute opened", `A dispute (${dispute.ref}) was opened on booking ${booking.id}. The settlement is on hold.`, `/dashboard/${actor.role === "IMPORTER" ? "owner" : "importer"}/disputes/${dispute.id}`)] : []),
        ...data.adminProfiles.filter((profile) => profile.permissions.includes("disputes")).map((profile) =>
          notification(profile.userId, "DISPUTE", "New dispute", `${dispute.ref} needs review.`, `/dashboard/admin/disputes/${dispute.id}`)),
      ],
    });
    return dispute;
  },

  async reply(actor, id, text, evidence = []) {
    await delay(250);
    const dispute = loadDispute(actor, id);
    if (["RESOLVED", "REJECTED"].includes(dispute.status)) conflict("This dispute is closed.");
    if (!text.trim()) invalid("Write a message first.", { text: "Enter a message." });
    const updated: DisputeCase = {
      ...dispute,
      messages: [...dispute.messages, { id: newId("m"), at: nowIso(), by: actor.id, text: text.trim() }],
      evidence: evidence.length ? [...dispute.evidence, ...evidence] : dispute.evidence,
      status: dispute.status === "AWAITING_INFO" && actor.role !== "ADMIN" ? "UNDER_REVIEW" : dispute.status,
      updatedAt: nowIso(),
    };
    saveDispute(actor, updated, "Replied to dispute", "", actor.role === "ADMIN" ? [dispute.raisedBy, dispute.againstUserId].filter((u): u is string => Boolean(u)).map((userId) => ({ userId, title: "Dispute update", body: `${dispute.ref} has a new message from iBanga.` })) : []);
    return forActor(actor, updated);
  },

  async addNote(actor, id, text, internal) {
    await delay(200);
    requirePermission(actor, "disputes");
    const dispute = loadDispute(actor, id);
    if (!text.trim()) invalid("Write a note first.", { text: "Enter a note." });
    const updated: DisputeCase = { ...dispute, notes: [...dispute.notes, { id: newId("n"), at: nowIso(), by: actor.id, text: text.trim(), internal }], updatedAt: nowIso() };
    saveDispute(actor, updated, "Added dispute note", internal ? "Internal" : "Visible to parties");
    return updated;
  },

  async assign(actor, id, adminId) {
    await delay(200);
    requirePermission(actor, "disputes");
    const dispute = loadDispute(actor, id);
    if (!db().adminProfiles.some((profile) => profile.userId === adminId)) notFound("Administrator");
    const updated: DisputeCase = { ...dispute, assignedTo: adminId, status: dispute.status === "OPEN" ? "UNDER_REVIEW" : dispute.status, updatedAt: nowIso() };
    saveDispute(actor, updated, "Assigned dispute", adminId);
    return updated;
  },

  async requestInfo(actor, id, request) {
    await delay(200);
    requirePermission(actor, "disputes");
    const dispute = loadDispute(actor, id);
    if (request.trim().length < 5) invalid("Say what information you need.", { request: "Enter a request." });
    const updated: DisputeCase = {
      ...dispute, status: "AWAITING_INFO", infoRequest: request.trim(),
      messages: [...dispute.messages, { id: newId("m"), at: nowIso(), by: actor.id, text: request.trim() }], updatedAt: nowIso(),
    };
    saveDispute(actor, updated, "Requested more information", request.trim(), [dispute.raisedBy, dispute.againstUserId].filter((u): u is string => Boolean(u)).map((userId) => ({ userId, title: "More information needed", body: `${dispute.ref}: ${request.trim()}` })));
    return updated;
  },

  async proposeResolution(actor, id, proposal) {
    await delay(200);
    requirePermission(actor, "disputes");
    const dispute = loadDispute(actor, id);
    if (proposal.trim().length < 5) invalid("Describe the proposed resolution.", { proposal: "Enter a proposal." });
    const updated: DisputeCase = { ...dispute, proposedResolution: proposal.trim(), updatedAt: nowIso() };
    saveDispute(actor, updated, "Proposed resolution", proposal.trim());
    return updated;
  },

  async decide(actor, id, decision) {
    await delay();
    requirePermission(actor, "disputes");
    const dispute = loadDispute(actor, id);
    if (["RESOLVED", "REJECTED"].includes(dispute.status)) conflict("This dispute is already closed.");
    if (decision.note.trim().length < 5) invalid("Record the reasoning for this decision.", { note: "Enter a note." });
    if (decision.type !== "NO_ACTION" && decision.type !== "RELEASE_TO_OWNER" && !(decision.amountRwf > 0)) invalid("Enter the decided amount.", { amountRwf: "Enter an amount." });
    const updated: DisputeCase = {
      ...dispute, status: "RESOLVED", resolvedAt: nowIso(), updatedAt: nowIso(),
      decision: { ...decision, note: decision.note.trim(), at: nowIso(), by: actor.id },
    };
    saveDispute(actor, updated, "Recorded dispute decision", `${decision.type} RWF ${decision.amountRwf}`, [dispute.raisedBy, dispute.againstUserId].filter((u): u is string => Boolean(u)).map((userId) => ({ userId, title: "Dispute resolved", body: `${dispute.ref} was resolved. Any refund or compensation is handled separately.` })));
    return updated;
  },

  async setStatus(actor, id, status, note) {
    await delay(200);
    requirePermission(actor, "disputes");
    const dispute = loadDispute(actor, id);
    const closing = status === "REJECTED" || status === "RESOLVED";
    if (status === "REJECTED" && (note ?? "").trim().length < 5) invalid("Explain why the dispute is rejected.", { note: "Enter a note." });
    const updated: DisputeCase = {
      ...dispute, status, updatedAt: nowIso(), resolvedAt: closing ? nowIso() : undefined,
      notes: note?.trim() ? [...dispute.notes, { id: newId("n"), at: nowIso(), by: actor.id, text: note.trim(), internal: false }] : dispute.notes,
    };
    saveDispute(actor, updated, `Set dispute ${status.toLowerCase().replace("_", " ")}`, note ?? "", status === "ESCALATED" ? [] : closing ? [dispute.raisedBy].map((userId) => ({ userId, title: "Dispute updated", body: `${dispute.ref} is now ${status.toLowerCase()}.` })) : []);
    return updated;
  },
};

/* ------------------------------------------------------------------ incidents & claims */

function incidentVisible(actor: Actor, item: Incident) {
  if (actor.role === "ADMIN") return true;
  if (actor.role === "TRUCK_OWNER") return item.reportedBy === actor.id || findTruck(item.truckId)?.ownerId === actor.id;
  return db().shipments.find((shipment) => shipment.id === item.shipmentId)?.importerId === actor.id;
}

function loadIncident(actor: Actor, id: string): Incident {
  const found = db().incidents.find((item) => item.id === id);
  if (!found) notFound("Incident");
  if (!incidentVisible(actor, found)) forbid();
  return found;
}

export const incidentService: IncidentService = {
  async list(actor, query) {
    await delay(200);
    return queryList(db().incidents.filter((item) => incidentVisible(actor, item)), { sort: { field: "createdAt", direction: "desc" }, ...query }, (item) => `${item.ref} ${item.type} ${item.location} ${item.status} ${item.description}`);
  },

  async get(actor, id) {
    await delay(120);
    return loadIncident(actor, id);
  },

  async report(actor, input) {
    await delay();
    if (actor.role === "IMPORTER") forbid("Only truck owners and administrators can report incidents.");
    const data = db();
    const shipment = data.shipments.find((item) => item.id === input.shipmentId);
    if (!shipment) notFound("Shipment");
    if (actor.role === "TRUCK_OWNER" && shipment.ownerId !== actor.id) forbid("You can only report incidents on your own shipments.");
    const errors: Record<string, string> = {};
    if (!input.location.trim()) errors.location = "Enter where it happened.";
    if (input.description.trim().length < 15) errors.description = "Describe what happened in at least 15 characters.";
    if (!input.immediateAction.trim()) errors.immediateAction = "Say what was done immediately.";
    if (!input.occurredAt) errors.occurredAt = "Enter when it happened.";
    if (Object.keys(errors).length) invalid("Complete the incident report.", errors);
    const incident: Incident = {
      ...input, id: newId("inc"), ref: nextRef("INC", data.incidents), reportedBy: actor.id, status: "REPORTED",
      timeline: [{ at: nowIso(), text: "Incident reported.", by: actor.id }], createdAt: nowIso(),
    };
    commit((current) => ({ ...current, incidents: [incident, ...current.incidents] }), {
      audit: [audit(actor, "Reported incident", "Incident", incident.ref, `${input.type} (${input.severity})`)],
      notifications: [
        notification(shipment.importerId, "INCIDENT", "Incident on your shipment", `${shipment.ref}: ${input.type.replaceAll("_", " ").toLowerCase()} reported at ${input.location}.`, `/dashboard/importer/shipments/${shipment.id}`),
        ...data.adminProfiles.filter((profile) => profile.permissions.includes("incidents")).map((profile) =>
          notification(profile.userId, "INCIDENT", `${input.severity === "CRITICAL" ? "Critical i" : "I"}ncident reported`, `${incident.ref}: ${input.type.replaceAll("_", " ").toLowerCase()} near ${input.location}.`, `/dashboard/admin/incidents/${incident.id}`)),
      ],
    });
    return incident;
  },

  async addTimeline(actor, id, text) {
    await delay(200);
    const incident = loadIncident(actor, id);
    if (actor.role === "IMPORTER") forbid();
    if (!text.trim()) invalid("Write an update first.", { text: "Enter an update." });
    const updated: Incident = { ...incident, timeline: [...incident.timeline, { at: nowIso(), text: text.trim(), by: actor.id }] };
    commit((current) => ({ ...current, incidents: replaceById(current.incidents, id, () => updated) }), { audit: [audit(actor, "Added incident update", "Incident", incident.ref, text.trim())] });
    return updated;
  },

  async setStatus(actor, id, status, resolution, responsibleParty) {
    await delay();
    requirePermission(actor, "incidents");
    const incident = loadIncident(actor, id);
    if (["RESOLVED", "CLOSED"].includes(status) && (resolution ?? "").trim().length < 5) invalid("Record how the incident was resolved.", { resolution: "Enter a resolution." });
    const updated: Incident = {
      ...incident, status, resolution: resolution?.trim() || incident.resolution, responsibleParty: responsibleParty?.trim() || incident.responsibleParty,
      timeline: [...incident.timeline, { at: nowIso(), text: `Status changed to ${status.replaceAll("_", " ").toLowerCase()}.`, by: actor.id }],
    };
    commit((current) => ({ ...current, incidents: replaceById(current.incidents, id, () => updated) }), {
      audit: [audit(actor, "Changed incident status", "Incident", incident.ref, status)],
      notifications: [notification(incident.reportedBy, "INCIDENT", "Incident updated", `${incident.ref} is now ${status.replaceAll("_", " ").toLowerCase()}.`, `/dashboard/owner/incidents/${id}`)],
    });
    return updated;
  },

  async listClaims(actor, query) {
    await delay(200);
    const claims = db().insuranceClaims.filter((claim) => {
      if (actor.role === "ADMIN") return true;
      const incident = db().incidents.find((item) => item.id === claim.incidentId);
      return incident ? incidentVisible(actor, incident) && actor.role === "TRUCK_OWNER" : false;
    });
    return queryList(claims, { sort: { field: "filedAt", direction: "desc" }, ...query }, (claim) => `${claim.ref} ${claim.policyNumber} ${claim.provider} ${claim.status}`);
  },

  async fileClaim(actor, incidentId, input) {
    await delay();
    if (actor.role === "IMPORTER") forbid();
    const incident = loadIncident(actor, incidentId);
    const data = db();
    if (incident.claimId) conflict("A claim has already been filed for this incident.");
    const policy = data.insurancePolicies.find((item) => item.id === input.policyId);
    if (!policy) notFound("Insurance policy");
    if (policy.truckId !== incident.truckId) invalid("Choose the policy that covers the truck in this incident.", { policyId: "Wrong policy for this truck." });
    if (policy.expiryDate < incident.occurredAt.slice(0, 10)) invalid("This policy had expired when the incident happened.", { policyId: "Policy expired." });
    if (!(input.claimedAmountRwf > 0) || input.claimedAmountRwf > policy.coverageRwf) invalid(`Claim an amount up to RWF ${policy.coverageRwf.toLocaleString("en-RW")}.`, { claimedAmountRwf: "Amount exceeds coverage." });
    const claim: InsuranceClaim = {
      id: newId("cl"), ref: nextRef("CLM", data.insuranceClaims), incidentId, policyId: policy.id, policyNumber: policy.policyNumber, provider: policy.provider,
      coverageRwf: policy.coverageRwf, claimedAmountRwf: input.claimedAmountRwf, status: "SUBMITTED", notes: input.notes.trim(), filedAt: nowIso(),
    };
    commit(
      (current) => ({
        ...current,
        insuranceClaims: [claim, ...current.insuranceClaims],
        incidents: replaceById(current.incidents, incidentId, (item) => ({ ...item, claimId: claim.id, status: "CLAIM_FILED", timeline: [...item.timeline, { at: nowIso(), text: `Insurance claim ${claim.ref} filed.`, by: actor.id }] })),
      }),
      { audit: [audit(actor, "Filed insurance claim", "Insurance claim", claim.ref, `${incident.ref}: RWF ${claim.claimedAmountRwf.toLocaleString("en-RW")}`)] },
    );
    return claim;
  },

  async decideClaim(actor, id, status, note) {
    await delay();
    requirePermission(actor, "insurance");
    const claim = db().insuranceClaims.find((item) => item.id === id);
    if (!claim) notFound("Insurance claim");
    if (["REJECTED", "PAID_SIMULATED"].includes(claim.status)) conflict("This claim is already final.");
    if (status === "PAID_SIMULATED" && claim.status !== "APPROVED") conflict("Approve the claim before recording a simulated payment.");
    if (status === "REJECTED" && note.trim().length < 5) invalid("Give the reason for rejecting the claim.", { note: "Enter a reason." });
    const updated: InsuranceClaim = { ...claim, status, decisionNote: note.trim() || claim.decisionNote, decidedAt: status === "UNDER_REVIEW" ? claim.decidedAt : nowIso() };
    commit((current) => ({ ...current, insuranceClaims: replaceById(current.insuranceClaims, id, () => updated) }), {
      audit: [audit(actor, `Claim ${status.replace("_", " ").toLowerCase()} (simulated)`, "Insurance claim", claim.ref, note.trim())],
    });
    return updated;
  },
};

/* ------------------------------------------------------------------ support */

function ticketVisible(actor: Actor, ticket: SupportTicket) {
  return actor.role === "ADMIN" || ticket.createdBy === actor.id;
}

function loadTicket(actor: Actor, id: string): SupportTicket {
  const found = db().supportTickets.find((item) => item.id === id);
  if (!found) notFound("Support ticket");
  if (!ticketVisible(actor, found)) forbid();
  return found;
}

export const supportService: SupportService = {
  async list(actor, query) {
    await delay(200);
    return queryList(db().supportTickets.filter((item) => ticketVisible(actor, item)), { sort: { field: "updatedAt", direction: "desc" }, ...query }, (item) => `${item.ref} ${item.subject} ${item.category} ${item.status}`);
  },

  async get(actor, id) {
    await delay(120);
    return loadTicket(actor, id);
  },

  async create(actor, input) {
    await delay();
    if (actor.role === "ADMIN") forbid("Administrators reply to tickets; customers create them.");
    const errors: Record<string, string> = {};
    if (input.subject.trim().length < 5) errors.subject = "Enter a subject of at least 5 characters.";
    if (input.message.trim().length < 10) errors.message = "Describe the problem in at least 10 characters.";
    if (Object.keys(errors).length) invalid("Check your ticket.", errors);
    const data = db();
    const ticket: SupportTicket = {
      id: newId("tk"), ref: nextRef("TKT", data.supportTickets), createdBy: actor.id, role: actor.role, subject: input.subject.trim(), category: input.category,
      priority: input.priority, status: "OPEN", relatedRef: input.relatedRef?.trim() || undefined, createdAt: nowIso(), updatedAt: nowIso(),
      messages: [{ id: newId("m"), at: nowIso(), by: actor.id, byRole: actor.role, text: input.message.trim() }],
    };
    commit((current) => ({ ...current, supportTickets: [ticket, ...current.supportTickets] }), {
      audit: [audit(actor, "Created support ticket", "Support ticket", ticket.ref, ticket.subject)],
      notifications: data.adminProfiles.filter((profile) => profile.permissions.includes("support")).map((profile) =>
        notification(profile.userId, "SUPPORT", "New support ticket", `${ticket.ref}: ${ticket.subject}`, `/dashboard/admin/support/${ticket.id}`)),
    });
    return ticket;
  },

  async reply(actor, id, text) {
    await delay(250);
    const ticket = loadTicket(actor, id);
    if (ticket.status === "CLOSED") conflict("This ticket is closed. Open a new ticket if you need more help.");
    if (!text.trim()) invalid("Write a message first.", { text: "Enter a message." });
    const updated: SupportTicket = {
      ...ticket, updatedAt: nowIso(),
      status: actor.role === "ADMIN" ? "AWAITING_CUSTOMER" : ticket.status === "AWAITING_CUSTOMER" || ticket.status === "RESOLVED" ? "IN_PROGRESS" : ticket.status,
      messages: [...ticket.messages, { id: newId("m"), at: nowIso(), by: actor.id, byRole: actor.role, text: text.trim() }],
    };
    commit((current) => ({ ...current, supportTickets: replaceById(current.supportTickets, id, () => updated) }), {
      notifications: actor.role === "ADMIN"
        ? [notification(ticket.createdBy, "SUPPORT", "Support replied", `${ticket.ref}: ${text.trim().slice(0, 80)}`, `/dashboard/${ticket.role === "IMPORTER" ? "importer" : "owner"}/support/${id}`)]
        : [],
    });
    return updated;
  },

  async update(actor, id, patch) {
    await delay(200);
    const ticket = loadTicket(actor, id);
    if (actor.role === "ADMIN") requirePermission(actor, "support");
    if (actor.role !== "ADMIN" && (patch.priority || patch.assignedTo || (patch.status && patch.status !== "CLOSED"))) forbid("You can only close your own ticket.");
    const updated: SupportTicket = { ...ticket, ...patch, updatedAt: nowIso() };
    commit((current) => ({ ...current, supportTickets: replaceById(current.supportTickets, id, () => updated) }), {
      audit: [audit(actor, "Updated support ticket", "Support ticket", ticket.ref, JSON.stringify(patch))],
    });
    return updated;
  },
};
