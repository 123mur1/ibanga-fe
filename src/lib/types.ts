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
  /** Size class used to filter the marketplace; one of VEHICLE_CATEGORIES. */
  category?: string;
  /** The owner's rate. A booking costs the road distance to the destination times this rate. */
  pricePerKmRwf?: number | null;
  /** Places the owner delivers to. Importers choose their destination from this list. */
  destinations?: string[];
  /** Cargo the vehicle is suited to carry; one or more of CARGO_TYPES. */
  acceptedCargo?: string[];
  /** Dates already taken by live bookings. The vehicle can be booked on any other dates. */
  bookedRanges?: BookedRange[];
};

/** Inclusive date span as local calendar days, "YYYY-MM-DD". */
export type BookedRange = { start: string; end: string };

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
  /** Road distance from the vehicle's location to the destination, used to price the trip. */
  distanceKm?: number | null;
  /** The vehicle's rate when the booking was made. */
  pricePerKmRwf?: number | null;
  payment?: BookingPayment | null;
  dispute?: Dispute | null;
  status: BookingStatus;
  createdAt: string;
  /** Set when the booking came from a cargo request and an accepted quotation. */
  cargoRequestId?: string;
  quotationId?: string;
  driverId?: string;
  /** When the owner accepted: the importer has DEPOSIT_WINDOW_MINUTES from then to pay the deposit. */
  acceptedAt?: string | null;
  /** Where the vehicle was when booked; the trip starts and ends there. */
  truckLocation?: string | null;
  pickupCountry?: string | null;
  pickupCity?: string | null;
  pickupArea?: string | null;
  destinationCountry?: string | null;
  destinationCity?: string | null;
  destinationArea?: string | null;
  /** Priced legs: vehicle location → pickup → destination → back. */
  routeLegs?: RouteLeg[] | null;
  /** Cargo and tax documents (without file contents). */
  documents?: BookingDocument[];
  /** Delays reported on this trip. */
  delays?: TripDelay[];
  /** Delays on an earlier trip of the same truck that overlap this booking. */
  delayImpacts?: DelayImpact[];
};

export type RouteLeg = { from: string; to: string; km: number; source: "google" | "estimate" };

export type BookingDocumentKind = "CARGO" | "TAX" | "OTHER";

export type BookingDocument = {
  id: string;
  bookingId: string;
  uploadedById: string;
  kind: BookingDocumentKind;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type TripDelay = {
  id: string;
  bookingId: string;
  reportedById: string;
  delayDays: number;
  reason: string;
  previousEndDate: string;
  newEndDate: string;
  createdAt: string;
};

export type DelayImpact = {
  id: string;
  delayId: string;
  bookingId: string;
  shiftDays: number;
  status: "PENDING" | "SHIFTED" | "REFUNDED";
  decidedAt?: string | null;
  createdAt: string;
  delay: Pick<TripDelay, "id" | "bookingId" | "delayDays" | "reason" | "newEndDate" | "createdAt">;
};

/** What the server charges for a trip, from GET /trucks/:id/quote. */
export type TripQuote = {
  truckLocation: string;
  pickupCity: string;
  pickupCountry: string;
  pickupArea: string | null;
  destinationCity: string;
  destinationCountry: string;
  destinationArea: string | null;
  legs: RouteLeg[];
  km: number;
  source: "google" | "estimate";
  pricePerKmRwf: number;
  priceRwf: number;
  depositRwf: number;
  balanceRwf: number;
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
  /** First instalment (half the price). While only it is paid, `amountRwf` equals it. */
  depositRwf?: number | null;
  /** Second instalment, paid on receipt; `amountRwf` is then the full price. */
  balanceRwf?: number | null;
  balancePaidAt?: string | null;
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
  /** Posted without an account. */
  guest?: boolean;
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
  "Tipper",
  "Lowbed",
] as const;

/** Vehicle size classes, from small delivery vehicles to heavy haulage. */
export const VEHICLE_CATEGORIES = [
  "Pickup and van",
  "Light truck",
  "Medium truck",
  "Heavy truck",
  "Trailer and articulated",
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
