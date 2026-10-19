export type Role = "IMPORTER" | "TRUCK_OWNER" | "ADMIN";
export type TruckStatus = "AVAILABLE" | "UNAVAILABLE";
export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "COMPLETED"
  | "DISPUTED"
  | "REJECTED";
export type DisputeStatus = "OPEN" | "RESOLVED";

export type PaymentMethod = "VISA" | "AIRTEL" | "MTN";
export type PaymentStatus = "PENDING" | "AUTHORIZED" | "FUNDED" | "HELD" | "RELEASED" | "REFUNDED";

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  phone: string;
  role: Role;
  location: string;
  active: boolean;
  company?: string;
  photo?: string;
  termsAcceptedAt?: string;
};

export type TruckOwnerContact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  photo?: string | null;
};

export type Truck = {
  id: string;
  ownerId: string;
  plateNumber: string;
  truckType: string;
  capacity: number;
  priceRwf?: number | null;
  currentLocation: string;
  preferredRoute: string;
  description: string;
  status: TruckStatus;
  photos: string[];
  owner?: TruckOwnerContact;
};

export type Booking = {
  id: string;
  truckId: string;
  importerId: string;
  cargoType: string;
  cargoDescription: string;
  cargoWeight: string;
  pickupLocation: string;
  destination: string;
  pickupDate: string;
  expectedDeliveryDate: string;
  additionalInstructions: string;
  agreedPrice: string;
  agreedPriceRwf?: number | null;
  payment?: BookingPayment | null;
  dispute?: Dispute | null;
  status: BookingStatus;
  createdAt: string;
  /** Set when the booking came from a cargo request and an accepted quotation. */
  cargoRequestId?: string;
  quotationId?: string;
  driverId?: string;
};

export type BookingPayment = {
  status: PaymentStatus;
  method: PaymentMethod;
  amountRwf: number;
  commissionRwf: number;
  ownerAmountRwf: number;
  paidAt: string;
  receiptNumber: string;
  payerName: string;
  accountMask: string;
  heldAt?: string | null;
  releasedAt?: string | null;
  refundedAt?: string | null;
  ownerConfirmedAt?: string | null;
  importerConfirmedAt?: string | null;
};

export type CheckoutDetails = {
  method: PaymentMethod;
  payerName: string;
  accountMask: string;
};

export type CargoPing = {
  id: string;
  bookingId: string;
  kmFromStart: number;
  lat: number;
  lng: number;
  label: string;
  recordedAt: string;
  kind: "DEPARTURE" | "CHECKPOINT" | "REST" | "DELIVERY";
  note?: string;
};

export type TripNotice = {
  id: string;
  bookingId: string;
  kind: "DEPARTURE" | "REST" | "RESUME";
  at: string;
  place: string;
  note: string;
};

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  href?: string;
  tone: "info" | "good" | "warn" | "bad";
  read: boolean;
  createdAt: string;
};

export type ActivityEntry = {
  id: string;
  actorName: string;
  action: string;
  detail: string;
  createdAt: string;
};

export type WalletTransaction = {
  id: string;
  userId?: string;
  type: "DEPOSIT" | "BOOKING_PAYMENT" | "BOOKING_EARNING" | "PLATFORM_COMMISSION" | "WITHDRAWAL" | "REFUND";
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  direction: "CREDIT" | "DEBIT";
  amountRwf: number;
  reference: string;
  description?: string | null;
  createdAt: string;
};

export type Dispute = {
  id: string;
  bookingId: string;
  raisedBy: string;
  reason: string;
  status: DisputeStatus;
  resolutionNotes: string;
  createdAt: string;
  resolvedAt?: string;
};

export type Review = {
  id: string;
  truckId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type RefundStatus = "REQUESTED" | "APPROVED" | "REJECTED";

export const REFUND_REASONS = [
  "Truck did not arrive",
  "Cargo plans changed",
  "Booking details were wrong",
  "Cargo was damaged or lost",
  "Charged more than the listed price",
  "Other",
] as const;

export type RefundRequest = {
  id: string;
  bookingId: string;
  importerId: string;
  reason: string;
  details: string;
  amountRwf: number;
  /** Where the importer wants the money returned, e.g. "MTN MoMo · 078 ••• 220". */
  refundTo: string;
  status: RefundStatus;
  ownerNote: string;
  createdAt: string;
  resolvedAt?: string;
  /** Optional ops fields: reference, origin of the refund and the (simulated) payout result. */
  ref?: string;
  source?: "REFUND" | "CANCELLATION" | "DISPUTE" | "INCIDENT";
  payoutState?: "PENDING" | "COMPLETED" | "FAILED";
  failureReason?: string;
};

export const TRUCK_TYPES = [
  "Container",
  "Flatbed",
  "Refrigerated",
  "Tanker",
  "Box truck",
  "Semi-trailer",
] as const;

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  "PENDING",
  "ACCEPTED",
  "IN_PROGRESS",
  "DELIVERED",
  "DISPUTED",
];

export const LOCATIONS = [
  "Kigali",
  "Mombasa",
  "Nairobi",
  "Kampala",
  "Dar es Salaam",
  "Rusumo",
  "Gisenyi",
  "Musanze",
];
