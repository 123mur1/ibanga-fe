/**
 * Service contracts for every operations domain.
 *
 * The UI only talks to these interfaces (through `services` in `./index.ts`). Today they are
 * implemented by in-browser mocks (`./mock/*`). When a backend exists, write API clients that
 * satisfy the same interfaces and switch them on in `./index.ts`; no page needs to change.
 *
 * The comment above each method shows the endpoint it should become. Every method receives the
 * `actor`; a real backend derives the actor from the session and MUST enforce ownership and role
 * rules itself. Payment, delivery, settlement and verification outcomes must be server-authoritative.
 */
import type { Booking } from "@/lib/types";
import type {
  AdminProfile,
  AdminRoleName,
  Announcement,
  AssignmentStatus,
  AuditLogEntry,
  CancellationRequest,
  CargoRequest,
  ClaimStatus,
  DeliveryEvidence,
  DisputeCase,
  DisputeCaseStatus,
  DisputeCategory,
  DisputeDecisionType,
  Driver,
  DriverAssignment,
  DriverStatus,
  EvidenceFile,
  Id,
  Incident,
  IncidentStatus,
  InsuranceClaim,
  InsurancePolicy,
  MilestoneKind,
  NotificationCategory,
  NotificationChannelPrefs,
  OpsData,
  OpsDocument,
  OpsNotification,
  Payout,
  Permission,
  PlatformSettings,
  Quotation,
  ReconciliationRecord,
  Settlement,
  Shipment,
  SupportTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TruckOpsStatus,
  TruckProfile,
  VerificationKind,
  VerificationRequest,
  CancellationStage,
  DocumentSubjectKind,
  DocumentType,
  IncidentType,
  IncidentSeverity,
  CargoCondition,
  Rwf,
} from "@/types/ops";
import type { Actor, ListQuery, Paged } from "./types";

export type CargoRequestInput = Omit<
  CargoRequest,
  "id" | "ref" | "importerId" | "status" | "createdAt" | "updatedAt" | "acceptedQuotationId" | "bookingId" | "cancelledReason"
>;

export interface CargoRequestService {
  /** GET /cargo-requests. Importers see their own, owners see open opportunities, admins see all. */
  list(actor: Actor, query?: ListQuery): Promise<Paged<CargoRequest>>;
  /** GET /cargo-requests/:id */
  get(actor: Actor, id: Id): Promise<CargoRequest>;
  /** POST /cargo-requests (`draft: true` saves without publishing). */
  create(actor: Actor, input: CargoRequestInput, draft: boolean): Promise<CargoRequest>;
  /** PATCH /cargo-requests/:id (only drafts and open requests without an accepted quotation). */
  update(actor: Actor, id: Id, patch: Partial<CargoRequestInput>): Promise<CargoRequest>;
  /** POST /cargo-requests/:id/publish */
  publishDraft(actor: Actor, id: Id): Promise<CargoRequest>;
  /** POST /cargo-requests/:id/cancel */
  cancel(actor: Actor, id: Id, reason: string): Promise<CargoRequest>;
}

export type QuotationInput = {
  cargoRequestId: Id;
  truckId: Id;
  driverId?: Id;
  amountRwf: Rwf;
  estimatedPickupDate: string;
  estimatedDeliveryDate: string;
  notes: string;
};

export interface QuotationService {
  /** GET /cargo-requests/:id/quotations */
  listForRequest(actor: Actor, cargoRequestId: Id): Promise<Quotation[]>;
  /** GET /quotations. Owners see their own, importers see quotes on their requests. */
  list(actor: Actor, query?: ListQuery): Promise<Paged<Quotation>>;
  /** POST /quotations. Validates truck eligibility, capacity, request status and duplicates. */
  submit(actor: Actor, input: QuotationInput): Promise<Quotation>;
  /** POST /quotations/:id/withdraw */
  withdraw(actor: Actor, id: Id): Promise<Quotation>;
  /**
   * POST /quotations/:id/accept. Idempotent per request: a second accept throws CONFLICT.
   * Marks competing quotes as not selected, books the request and schedules the shipment.
   * `bookingId` is the booking the caller created; a server would create it in the same transaction.
   */
  accept(actor: Actor, id: Id, bookingId: Id): Promise<{ quotation: Quotation; shipment: Shipment }>;
}

export type DriverInput = Omit<Driver, "id" | "ref" | "ownerId" | "verification" | "joinedAt" | "tripsCompleted" | "onTimeRate" | "rating">;

export type AssignmentInput = {
  driverId: Id;
  truckId: Id;
  bookingId?: Id;
  shipmentId?: Id;
  startDate: string;
  endDate: string;
};

export interface DriverService {
  /** GET /drivers */
  list(actor: Actor, query?: ListQuery): Promise<Paged<Driver>>;
  /** GET /drivers/:id */
  get(actor: Actor, id: Id): Promise<Driver>;
  /** POST /drivers */
  create(actor: Actor, input: DriverInput): Promise<Driver>;
  /** PATCH /drivers/:id */
  update(actor: Actor, id: Id, patch: Partial<DriverInput>): Promise<Driver>;
  /** PATCH /drivers/:id/status */
  setStatus(actor: Actor, id: Id, status: DriverStatus): Promise<Driver>;
  /** GET /driver-assignments */
  listAssignments(actor: Actor, filter?: { driverId?: Id; truckId?: Id; status?: AssignmentStatus }): Promise<DriverAssignment[]>;
  /** POST /driver-assignments/conflicts. Overlapping dates for the same driver or truck. */
  findConflicts(input: AssignmentInput, ignoreAssignmentId?: Id): Promise<DriverAssignment[]>;
  /** POST /driver-assignments. Rejects ineligible drivers/trucks and scheduling conflicts. */
  assign(actor: Actor, input: AssignmentInput): Promise<DriverAssignment>;
  /** POST /driver-assignments/:id/reassign. Changing an active assignment needs confirmation in the UI. */
  reassign(actor: Actor, assignmentId: Id, newDriverId: Id): Promise<DriverAssignment>;
  /** POST /driver-assignments/:id/cancel */
  cancelAssignment(actor: Actor, assignmentId: Id): Promise<DriverAssignment>;
}

export interface TruckOpsService {
  /** GET /trucks/:id/profile */
  getProfile(truckId: Id): Promise<TruckProfile | undefined>;
  /** GET /truck-profiles */
  listProfiles(actor: Actor): Promise<TruckProfile[]>;
  /** PATCH /trucks/:id/profile */
  updateProfile(actor: Actor, truckId: Id, patch: Partial<Omit<TruckProfile, "truckId">>): Promise<TruckProfile>;
  /** PATCH /trucks/:id/ops-status */
  setOpsStatus(actor: Actor, truckId: Id, status: TruckOpsStatus): Promise<TruckProfile>;
}

export type EvidenceInput = {
  recipientName: string;
  signatureDataUrl?: string;
  confirmationCode: string;
  photos: string[];
  deliveredAt: string;
  notes: string;
  damageReported: boolean;
  shortageReported: boolean;
};

export interface ShipmentService {
  /** GET /shipments */
  list(actor: Actor, query?: ListQuery): Promise<Paged<Shipment>>;
  /** GET /shipments/:id */
  get(actor: Actor, id: Id): Promise<Shipment>;
  /** GET /bookings/:id/shipment */
  getByBooking(actor: Actor, bookingId: Id): Promise<Shipment | undefined>;
  /** POST /shipments/:id/milestones. Demonstration only: a real source would be driver app or GPS. */
  recordMilestone(actor: Actor, id: Id, input: { kind: MilestoneKind; place: string; note: string }): Promise<Shipment>;
  /** POST /shipments/:id/delay */
  reportDelay(actor: Actor, id: Id, input: { reason: string; newEtaDate: string }): Promise<Shipment>;
  /** POST /shipments/:id/delivery-evidence. Submitted evidence is NOT verified delivery. */
  submitEvidence(actor: Actor, id: Id, input: EvidenceInput): Promise<Shipment>;
  /** POST /shipments/:id/delivery-evidence/review. Administrator only. */
  reviewEvidence(actor: Actor, id: Id, input: { approve: boolean; reason?: string }): Promise<Shipment>;
  /** Internal: create shipments/settlements for bookings that have none yet (idempotent). */
  syncFromBookings(bookings: Booking[], disputesOpenFor?: (bookingId: Id) => boolean): Promise<void>;
}

export interface SettlementService {
  /** GET /settlements */
  list(actor: Actor, query?: ListQuery): Promise<Paged<Settlement>>;
  /** GET /settlements/:id */
  get(actor: Actor, id: Id): Promise<Settlement>;
  /** Internal: re-evaluate stored statuses against bookings, shipments, disputes and incidents. */
  syncEligibility(bookings: Booking[]): Promise<void>;
  /** POST /settlements/:id/approve. Only when ELIGIBLE. Starts a simulated payout. */
  approve(actor: Actor, id: Id): Promise<Settlement>;
  /** POST /settlements/:id/payout-result. Simulates the provider outcome. */
  completePayout(actor: Actor, id: Id, outcome: "PAID" | "FAILED", failureReason?: string): Promise<Settlement>;
  /** POST /settlements/:id/retry */
  retryPayout(actor: Actor, id: Id): Promise<Settlement>;
  /** POST /settlements/:id/hold */
  hold(actor: Actor, id: Id, reason: string): Promise<Settlement>;
  /** POST /settlements/:id/release-hold */
  releaseHold(actor: Actor, id: Id): Promise<Settlement>;
  /** POST /settlements/:id/adjustments */
  addAdjustment(actor: Actor, id: Id, input: { amountRwf: Rwf; note: string }): Promise<Settlement>;
  /** GET /payouts */
  listPayouts(actor: Actor, query?: ListQuery): Promise<Paged<Payout>>;
}

export type DocumentInput = {
  type: DocumentType;
  subjectKind: DocumentSubjectKind;
  subjectId: Id;
  title: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  issueDate?: string;
  expiryDate?: string;
};

export interface DocumentService {
  /** GET /documents */
  list(actor: Actor, query?: ListQuery): Promise<Paged<OpsDocument>>;
  /** POST /documents */
  upload(actor: Actor, input: DocumentInput): Promise<OpsDocument>;
  /** POST /documents/:id/resubmit (new version after rejection or expiry) */
  resubmit(actor: Actor, id: Id, input: Pick<DocumentInput, "fileName" | "fileUrl" | "mimeType" | "issueDate" | "expiryDate">): Promise<OpsDocument>;
  /** POST /documents/:id/review. Administrator only. */
  review(actor: Actor, id: Id, input: { approve: boolean; reason?: string }): Promise<OpsDocument>;
  /** DELETE /documents/:id */
  remove(actor: Actor, id: Id): Promise<void>;
  /** GET /verification-requests */
  listVerifications(actor: Actor, query?: ListQuery): Promise<Paged<VerificationRequest>>;
  /** POST /verification-requests */
  submitVerification(
    actor: Actor,
    input: { kind: VerificationKind; subjectKind: DocumentSubjectKind; subjectId: Id; documentIds: Id[]; note?: string },
  ): Promise<VerificationRequest>;
  /** POST /verification-requests/:id/review. Administrator only. */
  reviewVerification(actor: Actor, id: Id, input: { approve: boolean; reason?: string }): Promise<VerificationRequest>;
  /** GET /insurance-policies */
  listPolicies(actor: Actor): Promise<InsurancePolicy[]>;
  /** POST /insurance-policies */
  savePolicy(actor: Actor, policy: Omit<InsurancePolicy, "id" | "ownerId"> & { id?: Id }): Promise<InsurancePolicy>;
}

export interface CancellationService {
  /** GET /cancellations */
  list(actor: Actor, query?: ListQuery): Promise<Paged<CancellationRequest>>;
  /** POST /cancellations. The fee and refund come from `calculateCancellation` (server-authoritative later). */
  request(
    actor: Actor,
    input: { bookingId: Id; stage: CancellationStage; paidAmountRwf: Rwf; reason: string; details: string },
  ): Promise<CancellationRequest>;
  /** POST /cancellations/:id/review. Administrator only. */
  review(actor: Actor, id: Id, input: { approve: boolean; note: string }): Promise<CancellationRequest>;
  /** POST /cancellations/:id/complete. Marks the (simulated) refund as processed. */
  complete(actor: Actor, id: Id): Promise<CancellationRequest>;
}

export type DisputeInput = {
  bookingId: Id;
  shipmentId?: Id;
  paymentRef?: string;
  againstUserId?: Id;
  category: DisputeCategory;
  description: string;
  evidence: EvidenceFile[];
};

export interface DisputeService {
  /** GET /disputes */
  list(actor: Actor, query?: ListQuery): Promise<Paged<DisputeCase>>;
  /** GET /disputes/:id */
  get(actor: Actor, id: Id): Promise<DisputeCase>;
  /** POST /disputes. Places a settlement hold on the shipment. */
  open(actor: Actor, input: DisputeInput): Promise<DisputeCase>;
  /** POST /disputes/:id/messages (participants and administrators) */
  reply(actor: Actor, id: Id, text: string, evidence?: EvidenceFile[]): Promise<DisputeCase>;
  /** POST /disputes/:id/notes. Administrator only; internal notes are hidden from participants. */
  addNote(actor: Actor, id: Id, text: string, internal: boolean): Promise<DisputeCase>;
  /** POST /disputes/:id/assign */
  assign(actor: Actor, id: Id, adminId: Id): Promise<DisputeCase>;
  /** POST /disputes/:id/request-info */
  requestInfo(actor: Actor, id: Id, request: string): Promise<DisputeCase>;
  /** POST /disputes/:id/propose */
  proposeResolution(actor: Actor, id: Id, proposal: string): Promise<DisputeCase>;
  /** POST /disputes/:id/decision. Records the decision only; refunds are a separate workflow. */
  decide(actor: Actor, id: Id, decision: { type: DisputeDecisionType; amountRwf: Rwf; note: string }): Promise<DisputeCase>;
  /** POST /disputes/:id/status */
  setStatus(actor: Actor, id: Id, status: DisputeCaseStatus, note?: string): Promise<DisputeCase>;
}

export type IncidentInput = {
  shipmentId: Id;
  truckId: Id;
  driverId?: Id;
  type: IncidentType;
  severity: IncidentSeverity;
  occurredAt: string;
  location: string;
  description: string;
  peopleInvolved: string;
  cargoCondition: CargoCondition;
  evidence: EvidenceFile[];
  immediateAction: string;
  assistanceNeeded: string;
};

export interface IncidentService {
  /** GET /incidents */
  list(actor: Actor, query?: ListQuery): Promise<Paged<Incident>>;
  /** GET /incidents/:id */
  get(actor: Actor, id: Id): Promise<Incident>;
  /** POST /incidents. Places a settlement hold on the shipment. */
  report(actor: Actor, input: IncidentInput): Promise<Incident>;
  /** POST /incidents/:id/timeline */
  addTimeline(actor: Actor, id: Id, text: string): Promise<Incident>;
  /** POST /incidents/:id/status */
  setStatus(actor: Actor, id: Id, status: IncidentStatus, resolution?: string, responsibleParty?: string): Promise<Incident>;
  /** GET /insurance-claims */
  listClaims(actor: Actor, query?: ListQuery): Promise<Paged<InsuranceClaim>>;
  /** POST /incidents/:id/claims. A claim is a request, not an approval or a payment. */
  fileClaim(actor: Actor, incidentId: Id, input: { policyId: Id; claimedAmountRwf: Rwf; notes: string }): Promise<InsuranceClaim>;
  /** POST /insurance-claims/:id/decision. Administrator only; outcomes are SIMULATED. */
  decideClaim(actor: Actor, id: Id, status: Extract<ClaimStatus, "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PAID_SIMULATED">, note: string): Promise<InsuranceClaim>;
}

export interface SupportService {
  /** GET /support-tickets */
  list(actor: Actor, query?: ListQuery): Promise<Paged<SupportTicket>>;
  /** GET /support-tickets/:id */
  get(actor: Actor, id: Id): Promise<SupportTicket>;
  /** POST /support-tickets */
  create(actor: Actor, input: { subject: string; category: TicketCategory; priority: TicketPriority; relatedRef?: string; message: string }): Promise<SupportTicket>;
  /** POST /support-tickets/:id/messages */
  reply(actor: Actor, id: Id, text: string): Promise<SupportTicket>;
  /** PATCH /support-tickets/:id */
  update(actor: Actor, id: Id, patch: { status?: TicketStatus; priority?: TicketPriority; assignedTo?: Id }): Promise<SupportTicket>;
}

export interface NotificationService {
  /** GET /notifications */
  list(userId: Id): Promise<OpsNotification[]>;
  /** POST /notifications/:id/read */
  markRead(userId: Id, id: Id): Promise<void>;
  /** POST /notifications/read-all */
  markAllRead(userId: Id): Promise<void>;
  /** GET /notification-preferences. Email, SMS and push are placeholders until integrated. */
  getPreferences(userId: Id): Promise<Record<NotificationCategory, NotificationChannelPrefs>>;
  /** PUT /notification-preferences */
  setPreference(userId: Id, category: NotificationCategory, prefs: NotificationChannelPrefs): Promise<void>;
  /** GET /announcements */
  listAnnouncements(actor: Actor): Promise<Announcement[]>;
  /** POST /announcements. Administrator only. */
  publishAnnouncement(actor: Actor, input: Omit<Announcement, "id" | "publishedAt" | "publishedBy">): Promise<Announcement>;
  /** DELETE /announcements/:id */
  removeAnnouncement(actor: Actor, id: Id): Promise<void>;
}

export interface AdminService {
  /** GET /audit-logs */
  listAudit(actor: Actor, query?: ListQuery): Promise<Paged<AuditLogEntry>>;
  /** GET /reconciliation */
  listReconciliation(actor: Actor, query?: ListQuery): Promise<Paged<ReconciliationRecord>>;
  /** POST /reconciliation/:id/resolve. Marks a record reviewed; never contacts a payment provider. */
  resolveReconciliation(actor: Actor, id: Id, note: string): Promise<ReconciliationRecord>;
  /** GET /admins */
  listAdmins(actor: Actor): Promise<AdminProfile[]>;
  /** PUT /admins/:userId */
  updateAdmin(actor: Actor, userId: Id, input: { adminRole: AdminRoleName; permissions: Permission[] }): Promise<AdminProfile>;
  /** GET /settings */
  getSettings(): Promise<PlatformSettings>;
  /** PUT /settings */
  updateSettings(actor: Actor, patch: Partial<PlatformSettings>): Promise<PlatformSettings>;
  /** Demonstration only: restore the seed data. */
  resetDemoData(): Promise<void>;
  /** Demonstration only: read the whole dataset (used by reports). */
  snapshot(): OpsData;
}

export type Services = {
  cargoRequests: CargoRequestService;
  quotations: QuotationService;
  drivers: DriverService;
  trucks: TruckOpsService;
  shipments: ShipmentService;
  settlements: SettlementService;
  documents: DocumentService;
  cancellations: CancellationService;
  disputes: DisputeService;
  incidents: IncidentService;
  support: SupportService;
  notifications: NotificationService;
  admin: AdminService;
};

export type { DeliveryEvidence };
