import {
  accountPassword,
  administratorPassword,
  seedBookings,
  seedDisputes,
  seedTrucks,
  seedUsers,
  seedVersion,
  seedWalletTransactions,
} from "./mock-data";
import { formatRwf, hydrateBooking } from "./payments";
import type {
  Booking,
  BookingStatus,
  Dispute,
  Role,
  Truck,
  TruckStatus,
  User,
  WalletTransaction,
} from "./types";

export const demoEnabled =
  process.env.NEXT_PUBLIC_DATA_SOURCE === "demo"
  || (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DATA_SOURCE !== "api");

export const demoAccounts = [
  { role: "Admin", email: "admin@ibanga.com", password: administratorPassword },
  { role: "Importer", email: "jeanine@importco.rw", password: accountPassword },
  { role: "Truck owner", email: "eric@ndayitrans.rw", password: accountPassword },
] as const;

export const demoBanks = [
  {
    code: "BK",
    name: "Bank of Kigali",
    branches: [
      { code: "BK-KGL", name: "Kigali main" },
      { code: "BK-MUS", name: "Musanze" },
    ],
  },
  {
    code: "EQ",
    name: "Equity Bank",
    branches: [
      { code: "EQ-KGL", name: "Kigali" },
      { code: "EQ-RBV", name: "Rubavu" },
    ],
  },
  {
    code: "IM",
    name: "I&M Bank",
    branches: [
      { code: "IM-KGL", name: "Kigali" },
      { code: "IM-HUY", name: "Huye" },
    ],
  },
];

export type DemoSession = {
  users: User[];
  bookings: Booking[];
  disputes: Dispute[];
  trucks: Truck[];
  transactions: WalletTransaction[];
  credentials: Record<string, string>;
};

type StoredDemo = {
  version: number;
  userId: string | null;
  session: DemoSession;
};

const STORAGE_KEY = "ibanga-demo-session-v1";

export type AdminCommissionSummary = {
  availableRwf: number;
  totalEarnedRwf: number;
  currency: string;
  monthlyHistory: { month: string; totalRwf: number }[];
};

export type DemoWalletAccount = {
  userId: string;
  name: string;
  email: string;
  role: Role;
  balance: number;
  transactions: WalletTransaction[];
};

function monthKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function recentMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

export function freshDemoSession(): DemoSession {
  const users = seedUsers.map((user) => ({
    ...user,
    termsAcceptedAt: user.termsAcceptedAt ?? user.createdAt,
  }));
  const bookings = seedBookings.map((booking) => {
    const hydrated = hydrateBooking(booking);
    const importer = users.find((user) => user.id === booking.importerId);
    if (!hydrated.payment || !importer) return hydrated;
    return {
      ...hydrated,
      payment: { ...hydrated.payment, payerName: importer.name },
    };
  });
  return {
    users,
    bookings,
    disputes: seedDisputes.map((dispute) => ({ ...dispute })),
    trucks: seedTrucks.map((truck) => ({ ...truck, photos: [...truck.photos] })),
    transactions: seedWalletTransactions.map((transaction) => ({ ...transaction })),
    credentials: Object.fromEntries(
      users.map((user) => [
        user.email.toLowerCase(),
        user.email.toLowerCase() === "admin@ibanga.com" ? administratorPassword : accountPassword,
      ]),
    ),
  };
}

export function loadDemoSession(): { userId: string | null; session: DemoSession } {
  if (typeof window === "undefined") {
    return { userId: null, session: freshDemoSession() };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { userId: null, session: freshDemoSession() };
    const stored = JSON.parse(raw) as StoredDemo;
    if (stored.version !== seedVersion || !stored.session?.users?.length) {
      return { userId: null, session: freshDemoSession() };
    }
    return { userId: stored.userId, session: stored.session };
  } catch {
    return { userId: null, session: freshDemoSession() };
  }
}

export function saveDemoSession(session: DemoSession, userId: string | null) {
  if (typeof window === "undefined") return;
  const payload: StoredDemo = { version: seedVersion, userId, session };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function walletBalanceFor(session: DemoSession, userId: string) {
  return session.transactions
    .filter((transaction) => transaction.userId === userId && transaction.status === "SUCCEEDED")
    .reduce((total, transaction) => total + (transaction.direction === "CREDIT" ? transaction.amountRwf : -transaction.amountRwf), 0);
}

export function walletAccountsFor(session: DemoSession): DemoWalletAccount[] {
  return session.users.map((user) => ({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    balance: walletBalanceFor(session, user.id),
    transactions: session.transactions.filter((transaction) => transaction.userId === user.id),
  }));
}

export function commissionFor(bookings: Booking[]): AdminCommissionSummary {
  const months = recentMonths();
  const totals = Object.fromEntries(months.map((month) => [month, 0]));
  let availableRwf = 0;
  let totalEarnedRwf = 0;
  for (const booking of bookings) {
    const payment = booking.payment;
    if (!payment) continue;
    if (payment.status === "HELD" || payment.status === "FUNDED" || payment.status === "AUTHORIZED") {
      availableRwf += payment.commissionRwf;
    }
    if (payment.status === "RELEASED") {
      totalEarnedRwf += payment.commissionRwf;
      const month = monthKey(payment.releasedAt || payment.paidAt || booking.createdAt);
      if (month in totals) totals[month] += payment.commissionRwf;
    }
  }
  return {
    availableRwf,
    totalEarnedRwf,
    currency: "RWF",
    monthlyHistory: months.map((month) => ({ month, totalRwf: totals[month] })),
  };
}

function nextId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

export function demoAuthenticate(session: DemoSession, email: string, password: string) {
  const user = session.users.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || session.credentials[user.email.toLowerCase()] !== password) {
    return { user: null, error: "Those demo credentials do not match an account." };
  }
  if (!user.active) return { user: null, error: "This demo account is inactive." };
  return { user, error: null };
}

export function demoRegister(
  session: DemoSession,
  input: {
    name: string;
    email: string;
    phone: string;
    location: string;
    company: string;
    password: string;
    role: Exclude<Role, "ADMIN">;
  },
): { session: DemoSession; user: User } | { error: string } {
  const email = input.email.trim().toLowerCase();
  if (session.users.some((user) => user.email.toLowerCase() === email)) {
    return { error: "An account with that email already exists." };
  }
  const user: User = {
    id: nextId("user"),
    name: input.name.trim(),
    email,
    phone: input.phone,
    location: input.location,
    company: input.company.trim() || undefined,
    role: input.role,
    active: true,
    createdAt: new Date().toISOString(),
    termsAcceptedAt: new Date().toISOString(),
    photo: input.role === "IMPORTER" ? "/photos/ibanga-importer-jeanine.png" : "/photos/ibanga-owner-eric.png",
  };
  return {
    user,
    session: {
      ...session,
      users: [user, ...session.users],
      credentials: { ...session.credentials, [email]: input.password },
    },
  };
}

export function demoCreateBooking(
  session: DemoSession,
  user: User,
  truck: Truck,
  input: Omit<Booking, "id" | "status" | "createdAt">,
): { session: DemoSession } | { error: string } {
  const cargoWeight = Number(input.cargoWeight);
  if (!Number.isFinite(cargoWeight) || cargoWeight <= 0) return { error: "Enter a valid cargo weight." };
  if (truck.status !== "AVAILABLE") return { error: "That truck is no longer available." };
  const amount = truck.priceRwf ?? 0;
  const booking: Booking = {
    ...input,
    id: nextId("booking"),
    importerId: user.id,
    truckId: truck.id,
    cargoWeight: `${cargoWeight} tons`,
    agreedPrice: amount ? formatRwf(amount) : input.agreedPrice,
    agreedPriceRwf: amount || input.agreedPriceRwf,
    status: "PENDING",
    payment: null,
    createdAt: new Date().toISOString(),
  };
  return {
    session: {
      ...session,
      bookings: [booking, ...session.bookings],
      trucks: session.trucks.map((item) => item.id === truck.id ? { ...item, status: "UNAVAILABLE" } : item),
    },
  };
}

export function demoSetBookingStatus(session: DemoSession, id: string, status: BookingStatus): DemoSession {
  const booking = session.bookings.find((item) => item.id === id);
  return {
    ...session,
    bookings: session.bookings.map((item) => item.id === id ? { ...item, status } : item),
    trucks: status === "REJECTED" && booking
      ? session.trucks.map((truck) => truck.id === booking.truckId ? { ...truck, status: "AVAILABLE" } : truck)
      : session.trucks,
  };
}

export function demoPayBooking(session: DemoSession, user: User, bookingId: string): { session: DemoSession } | { error: string } {
  const booking = session.bookings.find((item) => item.id === bookingId);
  if (!booking || booking.importerId !== user.id) return { error: "Booking not found." };
  if (booking.status !== "ACCEPTED") return { error: "Pay after the owner confirms the truck." };
  if (booking.payment && booking.payment.status !== "PENDING" && booking.payment.status !== "REFUNDED") {
    return { error: "This booking is already paid." };
  }
  const amount = booking.agreedPriceRwf ?? 0;
  if (amount <= 0) return { error: "This booking has no price." };
  if (walletBalanceFor(session, user.id) < amount) return { error: "The wallet balance does not cover this booking." };
  const paid = hydrateBooking({ ...booking, status: "ACCEPTED", agreedPriceRwf: amount });
  const payment = paid.payment
    ? { ...paid.payment, status: "FUNDED" as const, payerName: user.name, paidAt: new Date().toISOString(), heldAt: new Date().toISOString() }
    : null;
  const transaction: WalletTransaction = {
    id: nextId("tx"),
    userId: user.id,
    type: "BOOKING_PAYMENT",
    status: "SUCCEEDED",
    direction: "DEBIT",
    amountRwf: amount,
    reference: payment?.receiptNumber ?? booking.id,
    description: `${booking.pickupLocation} to ${booking.destination}`,
    createdAt: new Date().toISOString(),
  };
  return {
    session: {
      ...session,
      bookings: session.bookings.map((item) => item.id === bookingId ? { ...item, payment } : item),
      transactions: [transaction, ...session.transactions],
    },
  };
}

export function demoDeposit(session: DemoSession, user: User, amount: number): { session: DemoSession } | { error: string } {
  if (!Number.isFinite(amount) || amount < 1000) return { error: "Enter an amount of at least RWF 1,000." };
  const transaction: WalletTransaction = {
    id: nextId("tx"),
    userId: user.id,
    type: "DEPOSIT",
    status: "SUCCEEDED",
    direction: "CREDIT",
    amountRwf: amount,
    reference: nextId("DEP").toUpperCase(),
    description: "Demo wallet top-up",
    createdAt: new Date().toISOString(),
  };
  return { session: { ...session, transactions: [transaction, ...session.transactions] } };
}

export function demoWithdraw(
  session: DemoSession,
  user: User,
  amount: number,
): { session: DemoSession } | { error: string } {
  if (!Number.isFinite(amount) || amount < 1000) return { error: "Enter an amount of at least RWF 1,000." };
  if (walletBalanceFor(session, user.id) < amount) return { error: "That amount is higher than the available balance." };
  const transaction: WalletTransaction = {
    id: nextId("tx"),
    userId: user.id,
    type: "WITHDRAWAL",
    status: "SUCCEEDED",
    direction: "DEBIT",
    amountRwf: amount,
    reference: nextId("WDR").toUpperCase(),
    description: "Demo withdrawal",
    createdAt: new Date().toISOString(),
  };
  return { session: { ...session, transactions: [transaction, ...session.transactions] } };
}

export function demoReportProblem(session: DemoSession, user: User, bookingId: string, reason: string): DemoSession {
  const dispute: Dispute = {
    id: nextId("dispute"),
    bookingId,
    raisedBy: user.id,
    reason,
    status: "OPEN",
    resolutionNotes: "",
    createdAt: new Date().toISOString(),
  };
  return {
    ...session,
    disputes: [dispute, ...session.disputes],
    bookings: session.bookings.map((booking) => booking.id === bookingId ? { ...booking, status: "DISPUTED", dispute } : booking),
  };
}

export function demoResolveDispute(session: DemoSession, disputeId: string, notes: string): DemoSession {
  return {
    ...session,
    disputes: session.disputes.map((dispute) => dispute.id === disputeId
      ? { ...dispute, status: "RESOLVED", resolutionNotes: notes, resolvedAt: new Date().toISOString() }
      : dispute),
  };
}

export function demoAddTruck(session: DemoSession, user: User, input: {
  plateNumber: string;
  truckType: string;
  capacity: number;
  priceRwf: number;
  currentLocation?: string;
  preferredRoute?: string;
  description?: string;
  photos?: string[];
}): DemoSession {
  const truck: Truck = {
    id: nextId("truck"),
    ownerId: user.id,
    owner: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      photo: user.photo,
    },
    plateNumber: input.plateNumber,
    truckType: input.truckType,
    capacity: input.capacity,
    priceRwf: input.priceRwf,
    currentLocation: input.currentLocation ?? user.location,
    preferredRoute: input.preferredRoute ?? "",
    description: input.description ?? "",
    status: "AVAILABLE",
    photos: input.photos?.length ? input.photos : ["/photos/ibanga-container-highway.png"],
  };
  return { ...session, trucks: [truck, ...session.trucks] };
}

export function demoUpdateTruck(
  session: DemoSession,
  id: string,
  patch: Partial<Omit<Truck, "id" | "ownerId" | "owner" | "status">>,
): DemoSession {
  return {
    ...session,
    trucks: session.trucks.map((truck) => truck.id === id ? { ...truck, ...patch } : truck),
  };
}

export function demoSetAvailability(session: DemoSession, id: string, status: TruckStatus): DemoSession {
  return {
    ...session,
    trucks: session.trucks.map((truck) => truck.id === id ? { ...truck, status } : truck),
  };
}
