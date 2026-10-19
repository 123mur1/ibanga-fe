import { effectiveDocumentStatus } from "@/config/business-rules";
import type { DocumentSubjectKind, DocumentType, OpsData, OpsDocument, VerificationKind, VerificationRequest, VerificationStatus } from "@/types/ops";
import type { DocumentService } from "../contracts";
import type { Actor } from "../types";
import { findTruck } from "./directory";
import { audit, commit, conflict, db, delay, forbid, invalid, newId, nextRef, notFound, notification, nowIso, queryList, replaceById, requirePermission } from "./util";

const KIND_BY_TYPE: Partial<Record<DocumentType, VerificationKind>> = {
  IDENTITY: "IDENTITY",
  COMPANY_REGISTRATION: "COMPANY",
  DRIVER_LICENCE: "DRIVER",
  VEHICLE_REGISTRATION: "VEHICLE",
  VEHICLE_INSPECTION: "VEHICLE",
  INSURANCE_POLICY: "INSURANCE",
};

const TRUCK_REQUIRED: DocumentType[] = ["VEHICLE_REGISTRATION", "VEHICLE_INSPECTION", "INSURANCE_POLICY"];

/** Recompute truck/driver verification from the documents they currently have. */
export function recomputeSubject(data: OpsData, kind: DocumentSubjectKind, subjectId: string): OpsData {
  if (kind === "TRUCK") {
    const docs = data.documents.filter((doc) => doc.subjectKind === "TRUCK" && doc.subjectId === subjectId);
    const statuses = TRUCK_REQUIRED.map((type) => {
      const doc = docs.find((item) => item.type === type);
      return doc ? effectiveDocumentStatus(doc) : ("NOT_SUBMITTED" as VerificationStatus);
    });
    const verification: VerificationStatus = statuses.includes("EXPIRED")
      ? "EXPIRED"
      : statuses.includes("REJECTED")
        ? "REJECTED"
        : statuses.every((status) => status === "APPROVED")
          ? "APPROVED"
          : statuses.includes("PENDING")
            ? "PENDING"
            : "NOT_SUBMITTED";
    return { ...data, truckProfiles: data.truckProfiles.map((profile) => (profile.truckId === subjectId ? { ...profile, verification } : profile)) };
  }
  if (kind === "DRIVER") {
    const doc = data.documents.find((item) => item.subjectKind === "DRIVER" && item.subjectId === subjectId && item.type === "DRIVER_LICENCE");
    const verification: VerificationStatus = doc ? effectiveDocumentStatus(doc) : "NOT_SUBMITTED";
    return { ...data, drivers: data.drivers.map((driver) => (driver.id === subjectId ? { ...driver, verification } : driver)) };
  }
  return data;
}

function allowedSubject(actor: Actor, kind: DocumentSubjectKind, subjectId: string, data: OpsData) {
  if (actor.role === "ADMIN") return;
  if (kind === "USER" && subjectId !== actor.id) forbid("You can only upload documents for your own account.");
  if (kind === "TRUCK" && findTruck(subjectId)?.ownerId !== actor.id) forbid("This truck belongs to another owner.");
  if (kind === "DRIVER" && data.drivers.find((driver) => driver.id === subjectId)?.ownerId !== actor.id) forbid("This driver belongs to another owner.");
}

function scoped(actor: Actor, docs: OpsDocument[]) {
  return actor.role === "ADMIN" ? docs : docs.filter((doc) => doc.ownerId === actor.id);
}

function adminOnly(actor: Actor) {
  requirePermission(actor, "verifications");
}

function withPendingRequest(data: OpsData, actor: Actor, doc: OpsDocument): { requests: VerificationRequest[]; created?: VerificationRequest } {
  const kind = KIND_BY_TYPE[doc.type];
  if (!kind) return { requests: data.verificationRequests };
  const open = data.verificationRequests.find((item) => item.kind === kind && item.subjectId === doc.subjectId && item.status === "PENDING");
  if (open) {
    return { requests: data.verificationRequests.map((item) => (item.id === open.id ? { ...item, documentIds: [...new Set([...item.documentIds, doc.id])] } : item)) };
  }
  const created: VerificationRequest = {
    id: newId("vr"), ref: nextRef("VER", data.verificationRequests), kind, subjectKind: doc.subjectKind, subjectId: doc.subjectId,
    requesterId: actor.id, documentIds: [doc.id], status: "PENDING", submittedAt: nowIso(),
  };
  return { requests: [created, ...data.verificationRequests], created };
}

export const documentService: DocumentService = {
  async list(actor, query) {
    await delay(200);
    return queryList(scoped(actor, db().documents), { sort: { field: "submittedAt", direction: "desc" }, pageSize: 100, ...query }, (doc) => `${doc.ref} ${doc.title} ${doc.type} ${doc.fileName}`);
  },

  async upload(actor, input) {
    await delay();
    const data = db();
    allowedSubject(actor, input.subjectKind, input.subjectId, data);
    const errors: Record<string, string> = {};
    if (!input.title.trim()) errors.title = "Give the document a title.";
    if (!input.fileUrl) errors.file = "Choose a file to upload.";
    if (input.issueDate && input.expiryDate && input.expiryDate < input.issueDate) errors.expiryDate = "Expiry cannot be before the issue date.";
    if (Object.keys(errors).length) invalid("Check the document details.", errors);
    const ownerId = input.subjectKind === "USER" ? input.subjectId : actor.role === "ADMIN" ? (input.subjectKind === "TRUCK" ? findTruck(input.subjectId)?.ownerId : data.drivers.find((d) => d.id === input.subjectId)?.ownerId) ?? actor.id : actor.id;
    const doc: OpsDocument = { ...input, id: newId("doc"), ref: nextRef("DOC", data.documents), ownerId, status: "PENDING", submittedAt: nowIso(), version: 1 };
    commit(
      (current) => {
        const { requests } = withPendingRequest(current, actor, doc);
        return recomputeSubject({ ...current, documents: [doc, ...current.documents], verificationRequests: requests }, doc.subjectKind, doc.subjectId);
      },
      { audit: [audit(actor, "Uploaded document", "Document", doc.ref, doc.title)] },
    );
    return doc;
  },

  async resubmit(actor, id, input) {
    await delay();
    const doc = db().documents.find((item) => item.id === id);
    if (!doc) notFound("Document");
    if (actor.role !== "ADMIN" && doc.ownerId !== actor.id) forbid();
    if (doc.status === "PENDING") conflict("This document is already waiting for review.");
    if (!input.fileUrl) invalid("Choose a file to upload.", { file: "Choose a file." });
    const updated: OpsDocument = { ...doc, ...input, status: "PENDING", rejectionReason: undefined, reviewedAt: undefined, reviewedBy: undefined, submittedAt: nowIso(), version: doc.version + 1 };
    commit(
      (current) => {
        const { requests } = withPendingRequest(current, actor, updated);
        return recomputeSubject({ ...current, documents: replaceById(current.documents, id, () => updated), verificationRequests: requests }, doc.subjectKind, doc.subjectId);
      },
      { audit: [audit(actor, "Resubmitted document", "Document", doc.ref, `Version ${updated.version}`)] },
    );
    return updated;
  },

  async review(actor, id, input) {
    await delay();
    adminOnly(actor);
    const doc = db().documents.find((item) => item.id === id);
    if (!doc) notFound("Document");
    if (!input.approve && (input.reason ?? "").trim().length < 5) invalid("Tell the owner why the document was rejected.", { reason: "Enter a reason." });
    const updated: OpsDocument = {
      ...doc, status: input.approve ? "APPROVED" : "REJECTED", rejectionReason: input.approve ? undefined : input.reason?.trim(), reviewedAt: nowIso(), reviewedBy: actor.id,
    };
    commit(
      (current) => recomputeSubject({ ...current, documents: replaceById(current.documents, id, () => updated) }, doc.subjectKind, doc.subjectId),
      {
        audit: [audit(actor, input.approve ? "Approved document" : "Rejected document", "Document", doc.ref, input.reason?.trim() ?? "")],
        notifications: [notification(doc.ownerId, "DOCUMENT", input.approve ? "Document approved" : "Document rejected", input.approve ? `${doc.title} was approved.` : `${doc.title} was rejected: ${input.reason?.trim()}`, "/dashboard/owner/documents")],
      },
    );
    return updated;
  },

  async remove(actor, id) {
    await delay(200);
    const doc = db().documents.find((item) => item.id === id);
    if (!doc) notFound("Document");
    if (actor.role !== "ADMIN" && doc.ownerId !== actor.id) forbid();
    if (doc.status === "APPROVED") conflict("Approved documents cannot be deleted. Upload a replacement instead.");
    commit((current) => recomputeSubject({ ...current, documents: current.documents.filter((item) => item.id !== id) }, doc.subjectKind, doc.subjectId), {
      audit: [audit(actor, "Deleted document", "Document", doc.ref, doc.title)],
    });
  },

  async listVerifications(actor, query) {
    await delay(200);
    const all = db().verificationRequests.filter((item) => actor.role === "ADMIN" || item.requesterId === actor.id);
    return queryList(all, { sort: { field: "submittedAt", direction: "desc" }, ...query }, (item) => `${item.ref} ${item.kind} ${item.status} ${item.subjectId}`);
  },

  async submitVerification(actor, input) {
    await delay();
    const data = db();
    allowedSubject(actor, input.subjectKind, input.subjectId, data);
    if (!input.documentIds.length) invalid("Attach at least one document.");
    if (data.verificationRequests.some((item) => item.kind === input.kind && item.subjectId === input.subjectId && item.status === "PENDING")) {
      conflict("A verification request for this item is already pending.");
    }
    const request: VerificationRequest = {
      id: newId("vr"), ref: nextRef("VER", data.verificationRequests), ...input, requesterId: actor.id, status: "PENDING", submittedAt: nowIso(),
    };
    commit(
      (current) => ({
        ...current,
        verificationRequests: [request, ...current.verificationRequests],
        documents: current.documents.map((doc) => (input.documentIds.includes(doc.id) && doc.status !== "APPROVED" ? { ...doc, status: "PENDING" as const } : doc)),
      }),
      { audit: [audit(actor, "Submitted verification request", "Verification", request.ref, input.kind)] },
    );
    return request;
  },

  async reviewVerification(actor, id, input) {
    await delay();
    adminOnly(actor);
    const request = db().verificationRequests.find((item) => item.id === id);
    if (!request) notFound("Verification request");
    if (request.status !== "PENDING") conflict("This request has already been reviewed.");
    if (!input.approve && (input.reason ?? "").trim().length < 5) invalid("Tell the applicant why this was rejected.", { reason: "Enter a reason." });
    const status: VerificationStatus = input.approve ? "APPROVED" : "REJECTED";
    const updated: VerificationRequest = { ...request, status, reviewedAt: nowIso(), reviewedBy: actor.id, rejectionReason: input.approve ? undefined : input.reason?.trim() };
    commit(
      (current) =>
        recomputeSubject(
          {
            ...current,
            verificationRequests: replaceById(current.verificationRequests, id, () => updated),
            documents: current.documents.map((doc) =>
              request.documentIds.includes(doc.id) && doc.status === "PENDING"
                ? { ...doc, status, rejectionReason: input.approve ? undefined : input.reason?.trim(), reviewedAt: nowIso(), reviewedBy: actor.id }
                : doc,
            ),
          },
          request.subjectKind,
          request.subjectId,
        ),
      {
        audit: [audit(actor, input.approve ? "Approved verification" : "Rejected verification", "Verification", request.ref, input.reason?.trim() ?? "")],
        notifications: [notification(request.requesterId, "DOCUMENT", input.approve ? "Verification approved" : "Verification rejected", input.approve ? `${request.ref} was approved.` : `${request.ref} was rejected: ${input.reason?.trim()}`, "/dashboard/notifications")],
      },
    );
    return updated;
  },

  async listPolicies(actor) {
    await delay(150);
    return db().insurancePolicies.filter((policy) => actor.role === "ADMIN" || policy.ownerId === actor.id);
  },

  async savePolicy(actor, policy) {
    await delay();
    const truck = findTruck(policy.truckId);
    if (!truck) notFound("Truck");
    if (actor.role !== "ADMIN" && truck.ownerId !== actor.id) forbid();
    const errors: Record<string, string> = {};
    if (!policy.provider.trim()) errors.provider = "Enter the insurance provider.";
    if (!policy.policyNumber.trim()) errors.policyNumber = "Enter the policy number.";
    if (!(policy.coverageRwf > 0)) errors.coverageRwf = "Enter the coverage amount.";
    if (policy.expiryDate <= policy.issueDate) errors.expiryDate = "Expiry must be after the issue date.";
    if (Object.keys(errors).length) invalid("Check the policy details.", errors);
    const saved = { ...policy, id: policy.id ?? newId("pol"), ownerId: truck.ownerId };
    commit(
      (current) => ({
        ...current,
        insurancePolicies: current.insurancePolicies.some((item) => item.id === saved.id)
          ? replaceById(current.insurancePolicies, saved.id, () => saved)
          : [saved, ...current.insurancePolicies],
      }),
      { audit: [audit(actor, "Saved insurance policy", "Insurance policy", saved.policyNumber, truck.plateNumber)] },
    );
    return saved;
  },
};
