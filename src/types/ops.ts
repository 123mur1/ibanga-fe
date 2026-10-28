/**
 * Operations-domain types (cargo requests, quotations, shipments, settlements, ...).
 *
 * These sit next to the marketplace types in `@/lib/types` (User, Truck, Booking, Payment,
 * RefundRequest). Records link to each other by stable string IDs only, so the same shapes can
 * later be returned by a real API. Everything here is DEMONSTRATION data until a backend exists.
 */
import type { Role } from "@/lib/types";

export type Id = string;
/** ISO-8601 timestamp, e.g. "2026-10-19T08:30:00.000Z". */
export type IsoDate = string;
/** Whole Rwandan francs. */
export type Rwf = number;

/* ------------------------------------------------------------------ verification & documents */

export type VerificationStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export type DocumentType =
  | "IDENTITY"
  | "COMPANY_REGISTRATION"
  | "VEHICLE_REGISTRATION"
  | "VEHICLE_INSPECTION"
  | "INSURANCE_POLICY"
  | "DRIVER_LICENCE"
  | "PERMIT"
  | "OTHER";

export type DocumentSubjectKind = "USER" | "TRUCK" | "DRIVER";

export type OpsDocument = {
  id: Id;
  ref: string;
  type: DocumentType;
  subjectKind: DocumentSubjectKind;
  /** User, truck or driver ID, depending on `subjectKind`. */
  subjectId: Id;
  /** The user account that owns/uploaded the document. */
  ownerId: Id;
  title: string;
  fileName: string;
  /**
   * Data URL or sample path. A real backend would return a signed file URL. Empty in API lists,
   * where `hasFile` says a file exists and `loadDocumentFile` fetches it on demand.
   */
  fileUrl: string;
  hasFile?: boolean;
  mimeType: string;
  issueDate?: string;
  expiryDate?: string;
  status: VerificationStatus;
  rejectionReason?: string;
  submittedAt: IsoDate;
  reviewedAt?: IsoDate;
  reviewedBy?: Id;
  /** Increments each time the document is resubmitted after rejection or expiry. */
  version: number;
};

export type VerificationKind = "IDENTITY" | "COMPANY" | "DRIVER" | "VEHICLE" | "INSURANCE";

export type VerificationRequest = {
  id: Id;
  ref: string;
  kind: VerificationKind;
  subjectKind: DocumentSubjectKind;
  subjectId: Id;
  requesterId: Id;
  documentIds: Id[];
  status: VerificationStatus;
  submittedAt: IsoDate;
  reviewedAt?: IsoDate;
  reviewedBy?: Id;
  rejectionReason?: string;
  note?: string;
};

/* ------------------------------------------------------------------ cargo requests & quotations */

export type CargoCategory =
  | "GENERAL"
  | "BUILDING_MATERIALS"
  | "PERISHABLES"
  | "MACHINERY"
  | "FUEL_CHEMICALS"
  | "AGRICULTURE"
  | "RETAIL_GOODS"
  | "OTHER";

export type HandlingFlag = "FRAGILE" | "HAZARDOUS" | "PERISHABLE" | "SPECIAL_HANDLING";

export type CargoRequestStatus = "DRAFT" | "OPEN" | "QUOTED" | "BOOKED" | "CANCELLED" | "EXPIRED";

export type CargoStop = {
  location: string;
  address: string;
  contactName: string;
  contactPhone: string;
  /** Date (YYYY-MM-DD). */
  date: string;
};

export type CargoRequest = {
  id: Id;
  ref: string;
  importerId: Id;
  status: CargoRequestStatus;
  title: string;
  description: string;
  category: CargoCategory;
  pickup: CargoStop;
  delivery: CargoStop;
  weightTons: number;
  volumeM3: number;
  lengthM: number;
  widthM: number;
  heightM: number;
  truckType: string;
  minCapacityTons: number;
  valueRwf: Rwf;
  budgetRwf?: Rwf;
  flags: HandlingFlag[];
  loadingRequirements: string;
  unloadingRequirements: string;
  instructions: string;
  photos: string[];
  documentNames: string[];
  acceptedQuotationId?: Id;
  bookingId?: Id;
  cancelledReason?: string;
  createdAt: IsoDate;
  updatedAt: IsoDate;
};

export type QuotationStatus = "SUBMITTED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN" | "EXPIRED";

/** A price offer from a truck owner. A quotation is NOT a booking and NOT a payment. */
export type Quotation = {
  id: Id;
  ref: string;
  cargoRequestId: Id;
  ownerId: Id;
  truckId: Id;
  driverId?: Id;
  amountRwf: Rwf;
  estimatedPickupDate: string;
  estimatedDeliveryDate: string;
  notes: string;
  validUntil: IsoDate;
  status: QuotationStatus;
  createdAt: IsoDate;
  respondedAt?: IsoDate;
};

/* ------------------------------------------------------------------ trucks & drivers */

export type TruckOpsStatus = "AVAILABLE" | "RESERVED" | "IN_TRANSIT" | "MAINTENANCE" | "INACTIVE";

/** Operational detail for a marketplace truck (`@/lib/types` Truck), keyed by the same ID. */
export type TruckProfile = {
  /** Record id. Without it a new profile is never saved to the API. */
  id?: Id;
  truckId: Id;
  opsStatus: TruckOpsStatus;
  lengthM: number;
  widthM: number;
  heightM: number;
  volumeM3: number;
  suitability: string[];
  verification: VerificationStatus;
  tripsCompleted: number;
  onTimeRate: number;
  /** Share of the last 30 days the truck was on a booking, 0-100 (demonstration figure). */
  utilizationPct: number;
};

export type DriverStatus = "AVAILABLE" | "ON_TRIP" | "OFF_DUTY" | "SUSPENDED";

export type Driver = {
  id: Id;
  ref: string;
  ownerId: Id;
  /** Linked sign-in account. Legacy demonstration drivers may not have one. */
  userId?: Id;
  name: string;
  phone: string;
  email?: string;
  nationalId: string;
  licenceNumber: string;
  licenceCategory: string;
  licenceExpiry: string;
  status: DriverStatus;
  verification: VerificationStatus;
  photo?: string;
  assignedTruckId?: Id;
  joinedAt: IsoDate;
  tripsCompleted: number;
  onTimeRate: number;
  rating: number;
};

export type AssignmentStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export type DriverAssignment = {
  id: Id;
  driverId: Id;
  truckId: Id;
  bookingId?: Id;
  shipmentId?: Id;
  startDate: string;
  endDate: string;
  status: AssignmentStatus;
  replacedDriverId?: Id;
  createdAt: IsoDate;
};

/* ------------------------------------------------------------------ shipments */

export type ShipmentStatus =
  | "SCHEDULED"
  | "PICKUP_CONFIRMED"
  | "LOADED"
  | "DEPARTED"
  | "IN_TRANSIT"
  | "DELAYED"
  | "ARRIVED"
  | "UNLOADING"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export type MilestoneKind =
  | "PICKUP_CONFIRMED"
  | "LOADED"
  | "DEPARTED"
  | "IN_TRANSIT_UPDATE"
  | "DELAY"
  | "ARRIVED"
  | "UNLOADING"
  | "DELIVERED";

export type ShipmentMilestone = {
  id: Id;
  kind: MilestoneKind;
  at: IsoDate;
  place: string;
  note: string;
  recordedBy: Id;
  /** True when entered through the demonstration controls rather than a tracking source. */
  simulated: boolean;
};

export type EvidenceVerification = "SUBMITTED" | "VERIFIED" | "REJECTED";

/** Proof of delivery. Submitted evidence is NOT verified delivery until an admin verifies it. */
export type DeliveryEvidence = {
  submittedAt: IsoDate;
  submittedBy: Id;
  recipientName: string;
  /** Demonstration signature (data URL) captured on a canvas. */
  signatureDataUrl?: string;
  confirmationCode: string;
  photos: string[];
  deliveredAt: IsoDate;
  notes: string;
  damageReported: boolean;
  shortageReported: boolean;
  verification: EvidenceVerification;
  verifiedAt?: IsoDate;
  verifiedBy?: Id;
  rejectionReason?: string;
};

export type Shipment = {
  id: Id;
  ref: string;
  bookingId: Id;
  cargoRequestId?: Id;
  ownerId: Id;
  importerId: Id;
  truckId: Id;
  driverId?: Id;
  status: ShipmentStatus;
  etaDate: string;
  milestones: ShipmentMilestone[];
  delay?: { reason: string; newEtaDate: string; reportedAt: IsoDate };
  evidence?: DeliveryEvidence;
  /** Set while a dispute or incident holds the owner's settlement. */
  settlementHold?: string;
  createdAt: IsoDate;
};

/* ------------------------------------------------------------------ settlements & payouts */

export type SettlementStatus =
  | "NOT_ELIGIBLE"
  | "AWAITING_DELIVERY"
  | "AWAITING_VERIFICATION"
  | "ON_HOLD"
  | "ELIGIBLE"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REVERSED";

export type SettlementHistoryEntry = {
  at: IsoDate;
  status: SettlementStatus;
  actor: string;
  note: string;
};

export type Settlement = {
  id: Id;
  ref: string;
  bookingId: Id;
  shipmentId?: Id;
  ownerId: Id;
  agreedAmountRwf: Rwf;
  platformFeeRwf: Rwf;
  /** Approved deductions (e.g. agreed damage compensation). */
  deductionsRwf: Rwf;
  deductionNote?: string;
  /** Refund or compensation adjustments applied after payment. Negative reduces the payout. */
  adjustmentsRwf: Rwf;
  netAmountRwf: Rwf;
  status: SettlementStatus;
  holdReason?: string;
  payoutId?: Id;
  payoutRef?: string;
  processedAt?: IsoDate;
  paidAt?: IsoDate;
  failureReason?: string;
  history: SettlementHistoryEntry[];
  createdAt: IsoDate;
};

export type PayoutStatus = "PROCESSING" | "PAID" | "FAILED";

export type Payout = {
  id: Id;
  ref: string;
  ownerId: Id;
  settlementIds: Id[];
  amountRwf: Rwf;
  method: "MOBILE_MONEY" | "BANK";
  destination: string;
  status: PayoutStatus;
  failureReason?: string;
  createdAt: IsoDate;
  paidAt?: IsoDate;
};

/* ------------------------------------------------------------------ cancellations */

export type CancellationStage = "BEFORE_PAYMENT" | "AFTER_PAYMENT" | "AFTER_PICKUP";

export type CancellationStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED";

export type CancellationRequest = {
  id: Id;
  ref: string;
  bookingId: Id;
  requestedBy: Id;
  requesterRole: Role;
  reason: string;
  details: string;
  stage: CancellationStage;
  paidAmountRwf: Rwf;
  feeRwf: Rwf;
  refundRwf: Rwf;
  status: CancellationStatus;
  reviewedBy?: Id;
  reviewNote?: string;
  createdAt: IsoDate;
  resolvedAt?: IsoDate;
};

/* ------------------------------------------------------------------ disputes & support */

export type DisputeCategory =
  | "DAMAGED_CARGO"
  | "MISSING_CARGO"
  | "LATE_DELIVERY"
  | "PAYMENT_ISSUE"
  | "OVERCHARGE"
  | "DRIVER_CONDUCT"
  | "OTHER";

export type DisputeCaseStatus = "OPEN" | "UNDER_REVIEW" | "AWAITING_INFO" | "RESOLVED" | "REJECTED" | "ESCALATED";

export type EvidenceFile = { name: string; url: string };

export type DisputeDecisionType = "NO_ACTION" | "PARTIAL_REFUND" | "FULL_REFUND" | "COMPENSATION" | "RELEASE_TO_OWNER";

export type DisputeCase = {
  id: Id;
  ref: string;
  raisedBy: Id;
  raisedByRole: Role;
  againstUserId?: Id;
  bookingId: Id;
  shipmentId?: Id;
  paymentRef?: string;
  category: DisputeCategory;
  description: string;
  evidence: EvidenceFile[];
  status: DisputeCaseStatus;
  assignedTo?: Id;
  notes: { id: Id; at: IsoDate; by: Id; text: string; internal: boolean }[];
  messages: { id: Id; at: IsoDate; by: Id; text: string }[];
  infoRequest?: string;
  proposedResolution?: string;
  /** Recording a decision here does NOT move money. Refunds and payouts are separate workflows. */
  decision?: { type: DisputeDecisionType; amountRwf: Rwf; note: string; at: IsoDate; by: Id };
  createdAt: IsoDate;
  updatedAt: IsoDate;
  resolvedAt?: IsoDate;
};

export type TicketCategory = "ACCOUNT" | "BOOKING" | "PAYMENT" | "SHIPMENT" | "TECHNICAL" | "OTHER";
export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "AWAITING_CUSTOMER" | "RESOLVED" | "CLOSED";

export type TicketMessage = { id: Id; at: IsoDate; by: Id; byRole: Role; text: string };

export type SupportTicket = {
  id: Id;
  ref: string;
  createdBy: Id;
  role: Role;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  relatedRef?: string;
  assignedTo?: Id;
  messages: TicketMessage[];
  createdAt: IsoDate;
  updatedAt: IsoDate;
};

/* ------------------------------------------------------------------ incidents & insurance */

export type IncidentType =
  | "ACCIDENT"
  | "BREAKDOWN"
  | "CARGO_DAMAGE"
  | "MISSING_CARGO"
  | "DRIVER_UNAVAILABLE"
  | "EMERGENCY_DELAY";

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type CargoCondition = "INTACT" | "PARTIALLY_DAMAGED" | "DAMAGED" | "LOST";
export type IncidentStatus = "REPORTED" | "UNDER_INVESTIGATION" | "CLAIM_FILED" | "RESOLVED" | "CLOSED";

export type Incident = {
  id: Id;
  ref: string;
  reportedBy: Id;
  shipmentId: Id;
  truckId: Id;
  driverId?: Id;
  type: IncidentType;
  severity: IncidentSeverity;
  occurredAt: IsoDate;
  location: string;
  description: string;
  peopleInvolved: string;
  cargoCondition: CargoCondition;
  evidence: EvidenceFile[];
  immediateAction: string;
  assistanceNeeded: string;
  status: IncidentStatus;
  timeline: { at: IsoDate; text: string; by: Id }[];
  responsibleParty?: string;
  claimId?: Id;
  resolution?: string;
  createdAt: IsoDate;
};

export type InsurancePolicy = {
  id: Id;
  ownerId: Id;
  truckId: Id;
  provider: string;
  policyNumber: string;
  coverageRwf: Rwf;
  coverageNotes: string;
  issueDate: string;
  expiryDate: string;
  documentId?: Id;
};

export type ClaimStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PAID_SIMULATED";

export type InsuranceClaim = {
  id: Id;
  ref: string;
  incidentId: Id;
  policyId: Id;
  policyNumber: string;
  provider: string;
  coverageRwf: Rwf;
  claimedAmountRwf: Rwf;
  status: ClaimStatus;
  notes: string;
  filedAt: IsoDate;
  decidedAt?: IsoDate;
  decisionNote?: string;
};

/* ------------------------------------------------------------------ notifications & admin */

export type NotificationCategory =
  | "QUOTATION"
  | "BOOKING"
  | "PAYMENT"
  | "SHIPMENT"
  | "DELIVERY"
  | "SETTLEMENT"
  | "REFUND"
  | "DOCUMENT"
  | "INCIDENT"
  | "DISPUTE"
  | "SUPPORT"
  | "SYSTEM";

export type OpsNotification = {
  id: Id;
  userId: Id;
  category: NotificationCategory;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: IsoDate;
};

export type NotificationChannelPrefs = { inApp: boolean; email: boolean; sms: boolean; push: boolean };
/** Per-user, per-category channel preferences. Email/SMS/push are placeholders until integrated. */
export type NotificationPrefs = Record<string, Partial<Record<NotificationCategory, NotificationChannelPrefs>>>;

export type Announcement = {
  id: Id;
  title: string;
  body: string;
  audience: "ALL" | Role;
  severity: "INFO" | "WARNING" | "CRITICAL";
  publishedAt: IsoDate;
  publishedBy: Id;
  expiresAt?: IsoDate;
};

export type AuditLogEntry = {
  id: Id;
  at: IsoDate;
  actorId: Id;
  actorName: string;
  action: string;
  entityType: string;
  entityRef: string;
  detail: string;
};

export type ReconciliationStatus = "MATCHED" | "UNMATCHED" | "PENDING" | "DISCREPANCY" | "DUPLICATE";

export type ReconciliationRecord = {
  id: Id;
  ref: string;
  kind: "PAYMENT" | "REFUND" | "PAYOUT";
  bookingId?: Id;
  providerRef: string;
  expectedAmountRwf: Rwf;
  recordedAmountRwf: Rwf;
  status: ReconciliationStatus;
  date: IsoDate;
  note?: string;
};

export type AdminRoleName = "SUPER_ADMIN" | "OPERATIONS" | "FINANCE" | "SUPPORT";

export type Permission =
  | "users"
  | "verifications"
  | "trucks"
  | "drivers"
  | "cargo"
  | "bookings"
  | "shipments"
  | "payments"
  | "settlements"
  | "refunds"
  | "disputes"
  | "incidents"
  | "insurance"
  | "documents"
  | "reconciliation"
  | "reports"
  | "announcements"
  | "support"
  | "audit"
  | "settings"
  | "admins";

export type AdminProfile = {
  userId: Id;
  adminRole: AdminRoleName;
  permissions: Permission[];
};

export type PlatformSettings = {
  platformFeePct: number;
  quotationValidityDays: number;
  documentWarningDays: number;
  cancellationFreeWindowHours: number;
  maxQuotationsPerRequest: number;
  maintenanceBanner: string;
};

/** The whole demonstration dataset held by the mock database. */
export type OpsData = {
  cargoRequests: CargoRequest[];
  quotations: Quotation[];
  drivers: Driver[];
  driverAssignments: DriverAssignment[];
  truckProfiles: TruckProfile[];
  shipments: Shipment[];
  settlements: Settlement[];
  payouts: Payout[];
  documents: OpsDocument[];
  verificationRequests: VerificationRequest[];
  cancellations: CancellationRequest[];
  disputeCases: DisputeCase[];
  incidents: Incident[];
  insurancePolicies: InsurancePolicy[];
  insuranceClaims: InsuranceClaim[];
  supportTickets: SupportTicket[];
  notifications: OpsNotification[];
  notificationPrefs: NotificationPrefs;
  announcements: Announcement[];
  auditLog: AuditLogEntry[];
  reconciliation: ReconciliationRecord[];
  adminProfiles: AdminProfile[];
  settings: PlatformSettings;
};
