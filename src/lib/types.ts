export type Role = "IMPORTER" | "TRUCK_OWNER" | "DRIVER" | "ADMIN";
export type TruckStatus = "AVAILABLE" | "UNAVAILABLE";
export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "COMPLETED"
  | "DISPUTED"
  | "REJECTED"
  | "CANCELLED";
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
  /** In lists only the cover photo is included; `photoCount` is the full gallery size. */
  photos: string[];
  photoCount?: number;
  /** Whether an administrator has approved the truck's documents. */
  verification?: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
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
  /** The truck owner's side of the story. The owner responds; an administrator decides. */
  ownerNote: string;
  ownerRespondedAt?: string;
  truckOwnerId?: string;
  /** The administrator's reason for the decision, shown to both parties. */
  decisionNote?: string;
  /** What was actually refunded when approved (can be less than requested). */
  approvedAmountRwf?: number;
  decidedBy?: string;
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

/**
 * Places offered in every location dropdown, so the same town is always spelled the same way
 * and administrators can filter and report on it. Add new places here (and in `geo.ts` for the map).
 */
export const LOCATIONS = [
  "Kigali",
  "Musanze",
  "Huye",
  "Gisenyi",
  "Rusizi",
  "Nyagatare",
  "Muhanga",
  "Rwamagana",
  "Rusumo",
  "Gatuna",
  "Kagitumba",
  "Goma",
  "Bujumbura",
  "Kampala",
  "Nairobi",
  "Mombasa",
  "Isaka",
  "Dar es Salaam",
];

/**
 * The listed place a free-text location refers to ("Mombasa port" → "Mombasa"), so records
 * typed before the dropdowns existed still group and filter with the rest. Unknown text is kept.
 */
export function canonicalPlace(text: string): string {
  const key = text.trim().toLowerCase();
  const match = [...LOCATIONS].sort((a, b) => b.length - a.length).find((place) => key.includes(place.toLowerCase()));
  return match ?? text.trim();
}

/** Common trucking corridors, written "From — To" like the stored truck routes. */
export const ROUTES = [
  "Kigali — Mombasa",
  "Mombasa — Kigali",
  "Kigali — Dar es Salaam",
  "Dar es Salaam — Kigali",
  "Kigali — Kampala",
  "Kampala — Kigali",
  "Kigali — Nairobi",
  "Nairobi — Kigali",
  "Kigali — Rusumo",
  "Kigali — Gatuna",
  "Kigali — Goma",
  "Kigali — Bujumbura",
  "Kigali — Isaka",
  "Within Rwanda",
];

export const CARGO_TYPES = [
  "Coffee",
  "Tea",
  "Food and grains",
  "Fresh produce",
  "Beverages",
  "Building materials",
  "Cement",
  "Steel and metal",
  "Fuel and oil",
  "Chemicals",
  "Machinery and equipment",
  "Vehicles and spare parts",
  "Electronics",
  "Textiles and clothing",
  "Furniture",
  "Household goods",
  "Medical supplies",
  "General goods",
  "Other",
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "MTN", label: "MTN MoMo" },
  { value: "AIRTEL", label: "Airtel Money" },
  { value: "VISA", label: "Visa card" },
];

export const PAYMENT_METHOD_LABEL: Record<string, string> = Object.fromEntries(
  PAYMENT_METHODS.map((method) => [method.value, method.label]),
);
