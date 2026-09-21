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

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  location: string;
  active: boolean;
  company?: string;
  photo?: string;
};

export type TruckOwnerContact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
};

export type Truck = {
  id: string;
  ownerId: string;
  plateNumber: string;
  truckType: string;
  capacity: number;
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
  status: BookingStatus;
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
