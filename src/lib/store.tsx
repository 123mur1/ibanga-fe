"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { positionAt } from "./geo";
import {
  accountPassword,
  administratorPassword,
  seedBookings,
  seedDisputes,
  seedTrucks,
  seedUsers,
  seedWalletTransactions,
  seedVersion,
} from "./mock-data";
import { seedActivity, seedNotifications, seedNotices, seedPings } from "./ops-seed";
import { formatRwf, hydrateBooking, paymentShares } from "./payments";
import { ACTIVE_BOOKING_STATUSES } from "./types";
import type {
  ActivityEntry,
  AppNotification,
  Booking,
  BookingStatus,
  CargoPing,
  CheckoutDetails,
  Dispute,
  Role,
  TripNotice,
  Truck,
  TruckStatus,
  User,
  WalletTransaction,
} from "./types";

type NewBookingInput = Omit<Booking, "id" | "status" | "createdAt">;

export type NewTruckInput = {
  plateNumber: string;
  truckType: string;
  capacity: number;
  priceRwf: number;
  currentLocation?: string;
  preferredRoute?: string;
  description?: string;
  photos?: string[];
};

type AppState = {
  seedVersion: number;
  users: User[];
  bookings: Booking[];
  disputes: Dispute[];
  trucks: Truck[];
  currentUserId: string | null;
  balances: Record<string, number>;
  transactions: WalletTransaction[];
  credentials: Record<string, string>;
  pings: CargoPing[];
  notices: TripNotice[];
  notifications: AppNotification[];
  activity: ActivityEntry[];
};

const STORAGE_KEY = "ibanga-app-state-v5";
const initialState: AppState = {
  seedVersion,
  users: seedUsers.map((user) => ({ ...user, termsAcceptedAt: user.termsAcceptedAt ?? user.createdAt })),
  bookings: seedBookings.map(hydrateBooking),
  disputes: seedDisputes,
  trucks: seedTrucks,
  currentUserId: null,
  balances: Object.fromEntries(seedUsers.map((user) => [user.id, 600000 + seedUsers.indexOf(user) * 175000])),
  transactions: seedWalletTransactions,
  credentials: Object.fromEntries(seedUsers.map((user) => [
    user.email.toLowerCase(),
    user.email.toLowerCase() === "admin@ibanga.com" ? administratorPassword : accountPassword,
  ])),
  pings: seedPings,
  notices: seedNotices,
  notifications: seedNotifications,
  activity: seedActivity,
};

type Store = {
  ready: boolean;
  currentUser: User | null;
  users: User[];
  bookings: Booking[];
  disputes: Dispute[];
  trucks: Truck[];
  trucksLoading: boolean;
  walletBalance: number;
  transactions: WalletTransaction[];
  walletAccounts: {
    userId: string;
    name: string;
    email: string;
    role: Role;
    balance: number;
    transactions: WalletTransaction[];
  }[];
  login: (email: string, password: string) => Promise<string | null>;
  requestPasswordReset: (email: string) => Promise<{ message: string; error?: string } | null>;
  resetPassword: (token: string, password: string) => Promise<string | null>;
  register: (input: {
    name: string;
    email: string;
    phone: string;
    location: string;
    company: string;
    password: string;
    role: Exclude<Role, "ADMIN">;
    termsAccepted: boolean;
  }) => Promise<string | null>;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<User, "name" | "phone" | "location" | "company" | "photo">>) => Promise<string | null>;
  fetchTruck: (id: string) => Promise<Truck>;
  addTruck: (input: NewTruckInput) => Promise<string | null>;
  updateTruck: (
    id: string,
    patch: Partial<Omit<Truck, "id" | "ownerId" | "owner" | "status">>,
  ) => Promise<string | null>;
  deleteTruck: (id: string) => Promise<string | null>;
  setAvailability: (id: string, status: TruckStatus) => Promise<string | null>;
  createBooking: (truck: Truck, input: NewBookingInput, checkout: CheckoutDetails) => Promise<string | null>;
  setBookingStatus: (id: string, status: BookingStatus) => Promise<string | null>;
  notifyDeparture: (bookingId: string, at: string, place: string, note: string) => Promise<string | null>;
  notifyRest: (bookingId: string, at: string, place: string, note: string) => Promise<string | null>;
  notifyResume: (bookingId: string, note: string) => Promise<string | null>;
  recordCheckpoint: (bookingId: string) => Promise<string | null>;
  refundBooking: (bookingId: string, reason: string) => Promise<string | null>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  reportProblem: (bookingId: string, reason: string) => Promise<string | null>;
  resolveDispute: (disputeId: string, notes: string) => Promise<string | null>;
  setUserActive: (userId: string, active: boolean) => void;
  deleteUser: (userId: string) => string | null;
  resetWorkspace: () => Promise<string | null>;
  depositFunds: (amount: number) => string | null;
  withdrawFunds: (amount: number) => string | null;
  notifications: AppNotification[];
  activity: ActivityEntry[];
  pings: CargoPing[];
  notices: TripNotice[];
  escrowRwf: number;
};

const StoreContext = createContext<Store | null>(null);

function freshWorkspace(): AppState {
  return {
    ...initialState,
    users: seedUsers.map((user) => ({ ...user, termsAcceptedAt: user.termsAcceptedAt ?? user.createdAt })),
    bookings: seedBookings.map((booking) => hydrateBooking({ ...booking })),
    disputes: seedDisputes.map((dispute) => ({ ...dispute })),
    trucks: seedTrucks.map((truck) => ({ ...truck, photos: [...truck.photos] })),
    balances: { ...initialState.balances },
    transactions: initialState.transactions.map((transaction) => ({ ...transaction })),
    credentials: { ...initialState.credentials },
    pings: seedPings.map((ping) => ({ ...ping })),
    notices: seedNotices.map((notice) => ({ ...notice })),
    notifications: seedNotifications.map((item) => ({ ...item })),
    activity: seedActivity.map((entry) => ({ ...entry })),
  };
}

function mergeSeedRecords<T extends { id: string }>(
  seeded: T[],
  saved: T[] | undefined,
  includeSeeds: boolean,
): T[] {
  if (!includeSeeds) return saved ?? seeded;
  const records = new Map(seeded.map((record) => [record.id, record]));
  saved?.forEach((record) => records.set(record.id, record));
  return [...records.values()];
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function actorName(state: AppState, actorId: string | null) {
  return state.users.find((user) => user.id === actorId)?.name ?? "iBanga";
}

function partyIds(state: AppState, booking: Booking) {
  const truck = state.trucks.find((item) => item.id === booking.truckId);
  const admins = state.users.filter((user) => user.role === "ADMIN").map((user) => user.id);
  return [...new Set([booking.importerId, truck?.ownerId, ...admins].filter((id): id is string => Boolean(id)))];
}

function pushUpdate(
  state: AppState,
  userIds: string[],
  title: string,
  body: string,
  href: string,
  tone: AppNotification["tone"],
  action: string,
  detail: string,
  actorId: string | null,
) {
  const createdAt = new Date().toISOString();
  return {
    notifications: [
      ...userIds.map((userId, index) => ({
        id: uid(`nt${index}`),
        userId,
        title,
        body,
        href,
        tone,
        read: false,
        createdAt,
      })),
      ...state.notifications,
    ],
    activity: [{
      id: uid("act"),
      actorName: actorName(state, actorId),
      action,
      detail,
      createdAt,
    }, ...state.activity],
  };
}

function transaction(
  userId: string,
  type: WalletTransaction["type"],
  direction: WalletTransaction["direction"],
  amountRwf: number,
  description: string,
): WalletTransaction {
  return {
    id: `tx-${Date.now()}`,
    userId,
    type,
    status: "SUCCEEDED",
    direction,
    amountRwf,
    reference: `IB-${Math.floor(Math.random() * 90000) + 10000}`,
    description,
    createdAt: new Date().toISOString(),
  };
}

export function IbangaProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(freshWorkspace);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<AppState>;
          const includeNewSeeds = (parsed.seedVersion ?? 0) < seedVersion;
          const credentials = { ...initialState.credentials, ...parsed.credentials };
          for (const user of seedUsers) {
            credentials[user.email.toLowerCase()] = user.email.toLowerCase() === "admin@ibanga.com"
              ? administratorPassword
              : accountPassword;
          }
          setState({
            ...freshWorkspace(),
            ...parsed,
            seedVersion,
            users: mergeSeedRecords(seedUsers, parsed.users, includeNewSeeds).map((user) => ({
              ...user,
              termsAcceptedAt: user.termsAcceptedAt ?? user.createdAt,
            })),
            bookings: mergeSeedRecords(seedBookings, parsed.bookings, includeNewSeeds).map(hydrateBooking),
            disputes: mergeSeedRecords(seedDisputes, parsed.disputes, includeNewSeeds),
            trucks: mergeSeedRecords(seedTrucks, parsed.trucks, includeNewSeeds),
            balances: { ...initialState.balances, ...parsed.balances },
            transactions: mergeSeedRecords(
              seedWalletTransactions,
              parsed.transactions,
              includeNewSeeds,
            ),
            pings: parsed.pings ?? seedPings,
            notices: parsed.notices ?? seedNotices,
            notifications: parsed.notifications ?? seedNotifications,
            activity: parsed.activity ?? seedActivity,
            credentials,
          });
        }
      } catch (error) {
        console.error("Could not restore marketplace state.", error);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const currentUser =
    state.users.find((user) => user.id === state.currentUserId) ?? null;
  const currentUserId = currentUser?.id ?? null;

  const login = useCallback(async (email: string, password: string) => {
    const user = state.users.find(
      (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!user || state.credentials[user.email.toLowerCase()] !== password) {
      return "The email or password is incorrect.";
    }
    if (!user.active) return "This account is currently inactive.";
    setState((current) => ({ ...current, currentUserId: user.id }));
    return null;
  }, [state.credentials, state.users]);

  const requestPasswordReset = useCallback(async (email: string) => ({
    message: state.users.some((user) => user.email.toLowerCase() === email.toLowerCase())
      ? "Password recovery email is not available yet. Contact support for assistance."
      : "No account was found for that email.",
  }), [state.users]);

  const resetPassword = useCallback(async () =>
    "Password reset is not available yet. Contact support for assistance.", []);

  const register = useCallback<Store["register"]>(async (input) => {
    if (!input.termsAccepted) return "Accept the iBanga terms and conditions to create an account.";
    if (state.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
      return "An account with this email already exists.";
    }
    const user: User = {
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      termsAcceptedAt: new Date().toISOString(),
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: input.role,
      location: input.location,
      company: input.company,
      active: true,
    };
    setState((current) => ({
      ...current,
      users: [...current.users, user],
      currentUserId: user.id,
      balances: { ...current.balances, [user.id]: 0 },
      credentials: { ...current.credentials, [input.email.toLowerCase()]: input.password },
    }));
    return null;
  }, [state.users]);

  const logout = useCallback(() => {
    setState((current) => ({ ...current, currentUserId: null }));
  }, []);

  const updateProfile = useCallback<Store["updateProfile"]>(async (patch) => {
    if (!currentUserId) return "Sign in to update your profile.";
    setState((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === currentUserId ? { ...user, ...patch } : user,
      ),
    }));
    return null;
  }, [currentUserId]);

  const fetchTruck = useCallback<Store["fetchTruck"]>(async (id) => {
    const truck = state.trucks.find((item) => item.id === id);
    if (!truck) throw new Error("Truck not found in the marketplace.");
    return truck;
  }, [state.trucks]);

  const addTruck = useCallback<Store["addTruck"]>(async (input) => {
    if (!currentUserId) return "Sign in to list a truck.";
    setState((current) => ({
      ...current,
      trucks: [{
        ...input,
        id: `truck-${Date.now()}`,
        ownerId: currentUserId,
        currentLocation: input.currentLocation ?? current.users.find((user) => user.id === currentUserId)?.location ?? "",
        preferredRoute: input.preferredRoute ?? "",
        description: input.description ?? "",
        photos: input.photos ?? [],
        status: "AVAILABLE",
      }, ...current.trucks],
    }));
    return null;
  }, [currentUserId]);

  const updateTruck = useCallback<Store["updateTruck"]>(async (id, patch) => {
    setState((current) => ({
      ...current,
      trucks: current.trucks.map((truck) => truck.id === id ? { ...truck, ...patch } : truck),
    }));
    return null;
  }, []);

  const deleteTruck = useCallback<Store["deleteTruck"]>(async (id) => {
    if (state.bookings.some((booking) => booking.truckId === id)) {
      return "This truck is linked to booking history and cannot be removed.";
    }
    setState((current) => ({
      ...current,
      trucks: current.trucks.filter((truck) => truck.id !== id),
    }));
    return null;
  }, [state.bookings]);

  const setAvailability = useCallback<Store["setAvailability"]>(async (id, status) => {
    if (
      status === "AVAILABLE" &&
      state.bookings.some((booking) =>
        booking.truckId === id &&
        ACTIVE_BOOKING_STATUSES.includes(booking.status),
      )
    ) {
      return "This truck has an active booking and cannot be made available yet.";
    }
    setState((current) => ({
      ...current,
      trucks: current.trucks.map((truck) => truck.id === id ? { ...truck, status } : truck),
    }));
    return null;
  }, [state.bookings]);

  const createBooking = useCallback<Store["createBooking"]>(async (truck, input, checkout) => {
    if (!currentUserId) return "Sign in to book a truck.";
    const importer = state.users.find((user) => user.id === currentUserId);
    if (importer?.role !== "IMPORTER") return "Only importer accounts can book trucks.";
    if (!["VISA", "AIRTEL", "MTN"].includes(checkout.method)) {
      return "Pay with a Visa card, Airtel Money, or MTN MoMo.";
    }
    if (!checkout.payerName.trim() || !checkout.accountMask.trim()) {
      return "Enter the payer name and payment account.";
    }
    const amount = truck.priceRwf ?? 0;
    if (amount < 1000) return "This truck does not have a bookable price.";
    const paidAt = new Date().toISOString();
    const bookingId = `booking-${Date.now()}`;
    const booking: Booking = {
      ...input,
      id: bookingId,
      importerId: currentUserId,
      truckId: truck.id,
      agreedPrice: formatRwf(amount),
      agreedPriceRwf: amount,
      status: "PENDING",
      createdAt: paidAt,
      payment: {
        status: "AUTHORIZED",
        method: checkout.method,
        ...paymentShares(amount),
        paidAt,
        receiptNumber: `IB-${Date.now().toString().slice(-10)}`,
        payerName: checkout.payerName.trim(),
        accountMask: checkout.accountMask,
      },
    };
    setState((current) => {
      const update = pushUpdate(
        current,
        partyIds(current, booking),
        "Booking paid",
        `${booking.pickupLocation} to ${booking.destination} is paid and waiting for the owner to confirm the truck.`,
        `/dashboard/tracking/${booking.id}`,
        "warn",
        "Paid a booking",
        `${booking.pickupLocation} to ${booking.destination} · ${checkout.method} · ${formatRwf(amount)} at ${paidAt}`,
        currentUserId,
      );
      return {
        ...current,
        ...update,
        bookings: [booking, ...current.bookings],
        trucks: current.trucks.map((item) => item.id === truck.id ? { ...item, status: "UNAVAILABLE" } : item),
      };
    });
    return null;
  }, [currentUserId, state.users]);

  const setBookingStatus = useCallback<Store["setBookingStatus"]>(async (id, status) => {
    let error: string | null = null;
    setState((current) => {
      const booking = current.bookings.find((item) => item.id === id);
      if (!booking?.payment) {
        error = "This booking has no payment record.";
        return current;
      }
      const now = new Date().toISOString();
      const route = `${booking.pickupLocation} to ${booking.destination}`;
      const people = partyIds(current, booking);
      const truck = current.trucks.find((item) => item.id === booking.truckId);

      if (status === "ACCEPTED") {
        if (booking.status !== "PENDING" || booking.payment.status !== "AUTHORIZED") {
          error = "Only a paid request can move funds into the iBanga account.";
          return current;
        }
        const update = pushUpdate(current, people, "Payment held by iBanga", `${route} is in the system account until both sides confirm delivery.`, `/dashboard/tracking/${id}`, "info", "Confirmed truck availability", route, current.currentUserId);
        return {
          ...current,
          ...update,
          bookings: current.bookings.map((item) => item.id === id ? { ...booking, status, payment: { ...booking.payment!, status: "HELD", heldAt: now } } : item),
        };
      }

      if (status === "REJECTED") {
        if (booking.payment.status === "RELEASED") {
          error = "A released payment cannot be refunded from this screen.";
          return current;
        }
        const update = pushUpdate(current, people, "Payment refunded", `${formatRwf(booking.payment.amountRwf)} for ${route} returns to the original ${booking.payment.method} account.`, `/dashboard/tracking/${id}`, "warn", "Refunded a booking", route, current.currentUserId);
        return {
          ...current,
          ...update,
          bookings: current.bookings.map((item) => item.id === id ? { ...booking, status, payment: { ...booking.payment!, status: "REFUNDED", refundedAt: now } } : item),
          trucks: current.trucks.map((item) => item.id === booking.truckId ? { ...item, status: "AVAILABLE" } : item),
        };
      }

      if (status === "DELIVERED") {
        if (booking.status !== "IN_PROGRESS" || booking.payment.status !== "HELD") {
          error = "Confirm delivery only after departure, while the payment is still held.";
          return current;
        }
        const arrival = positionAt(booking.pickupLocation, booking.destination, 999999);
        const update = pushUpdate(current, people, "Cargo marked delivered", `${route} is waiting for the importer to confirm receipt. Payment stays held.`, `/dashboard/tracking/${id}`, "warn", "Marked cargo delivered", route, current.currentUserId);
        return {
          ...current,
          ...update,
          bookings: current.bookings.map((item) => item.id === id ? { ...booking, status, payment: { ...booking.payment!, ownerConfirmedAt: now } } : item),
          pings: [{
            id: uid("ping"),
            bookingId: id,
            kmFromStart: arrival.totalKm,
            lat: arrival.lat,
            lng: arrival.lng,
            label: booking.destination,
            recordedAt: now,
            kind: "DELIVERY",
            note: "Owner confirmed the cargo was delivered.",
          }, ...current.pings],
        };
      }

      if (status === "COMPLETED") {
        if (booking.status !== "DELIVERED" || !booking.payment.ownerConfirmedAt) {
          error = "The owner has to confirm delivery before receipt can release the payment.";
          return current;
        }
        if (booking.payment.status !== "HELD" || !truck) {
          error = "There is no held payment to release.";
          return current;
        }
        const earning = transaction(truck.ownerId, "BOOKING_EARNING", "CREDIT", booking.payment.ownerAmountRwf, `Escrow release for ${route}`);
        const update = pushUpdate(current, people, "Payment released", `${formatRwf(booking.payment.ownerAmountRwf)} was released to the truck owner for ${route}.`, `/dashboard/tracking/${id}`, "good", "Released escrow", route, current.currentUserId);
        return {
          ...current,
          ...update,
          bookings: current.bookings.map((item) => item.id === id ? { ...booking, status, payment: { ...booking.payment!, status: "RELEASED", importerConfirmedAt: now, releasedAt: now } } : item),
          trucks: current.trucks.map((item) => item.id === booking.truckId ? { ...item, status: "AVAILABLE" } : item),
          balances: { ...current.balances, [truck.ownerId]: (current.balances[truck.ownerId] ?? 0) + booking.payment!.ownerAmountRwf },
          transactions: [earning, ...current.transactions],
        };
      }

      error = "Record departure from the trip screen before changing this status.";
      return current;
    });
    return error;
  }, []);

  const reportProblem = useCallback<Store["reportProblem"]>(async (bookingId, reason) => {
    if (!currentUserId) return "Sign in to report a booking issue.";
    setState((current) => ({
      ...current,
      disputes: [{
        id: `dispute-${Date.now()}`,
        bookingId,
        raisedBy: currentUserId,
        reason,
        status: "OPEN",
        resolutionNotes: "",
        createdAt: new Date().toISOString(),
      }, ...current.disputes],
      bookings: current.bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status: "DISPUTED" } : booking,
      ),
    }));
    return null;
  }, [currentUserId]);

  const resolveDispute = useCallback<Store["resolveDispute"]>(async (disputeId, notes) => {
    setState((current) => ({
      ...current,
      disputes: current.disputes.map((dispute) =>
        dispute.id === disputeId
          ? { ...dispute, status: "RESOLVED", resolutionNotes: notes, resolvedAt: new Date().toISOString() }
          : dispute,
      ),
    }));
    return null;
  }, []);

  const setUserActive = useCallback((userId: string, active: boolean) => {
    setState((current) => ({
      ...current,
      users: current.users.map((user) => user.id === userId ? { ...user, active } : user),
    }));
  }, []);

  const deleteUser = useCallback<Store["deleteUser"]>((userId) => {
    const user = state.users.find((item) => item.id === userId);
    if (!user) return "This account could not be found.";
    if (user.role === "ADMIN" || userId === currentUserId) {
      return "Administrator accounts and your active account cannot be removed.";
    }
    const ownedTruckIds = new Set(
      state.trucks.filter((truck) => truck.ownerId === userId).map((truck) => truck.id),
    );
    if (state.bookings.some((booking) =>
      booking.importerId === userId || ownedTruckIds.has(booking.truckId),
    )) {
      return "This account is linked to booking history. Deactivate it instead to preserve marketplace records.";
    }
    const email = user.email.toLowerCase();
    setState((current) => ({
      ...current,
      users: current.users.filter((user) => user.id !== userId),
      trucks: current.trucks.filter((truck) => truck.ownerId !== userId),
      balances: Object.fromEntries(Object.entries(current.balances).filter(([id]) => id !== userId)),
      transactions: current.transactions.filter((entry) => entry.userId !== userId),
      credentials: Object.fromEntries(Object.entries(current.credentials).filter(([key]) => key !== email)),
    }));
    return null;
  }, [currentUserId, state.bookings, state.trucks, state.users]);

  const resetWorkspace = useCallback(async () => {
    setState((current) => ({ ...freshWorkspace(), currentUserId: current.currentUserId }));
    return null;
  }, []);

  const depositFunds = useCallback((amount: number) => {
    if (!currentUserId || !Number.isFinite(amount) || amount < 1000) {
      return "Enter a valid amount of at least RWF 1,000.";
    }
    const entry = transaction(currentUserId, "DEPOSIT", "CREDIT", amount, "Wallet top-up");
    setState((current) => ({
      ...current,
      balances: { ...current.balances, [currentUserId]: (current.balances[currentUserId] ?? 0) + amount },
      transactions: [entry, ...current.transactions],
    }));
    return null;
  }, [currentUserId]);

  const withdrawFunds = useCallback((amount: number) => {
    if (!currentUserId || !Number.isFinite(amount) || amount < 1000) {
      return "Enter a valid amount of at least RWF 1,000.";
    }
    if ((state.balances[currentUserId] ?? 0) < amount) return "Insufficient wallet balance.";
    const entry = transaction(currentUserId, "WITHDRAWAL", "DEBIT", amount, "Wallet withdrawal");
    setState((current) => ({
      ...current,
      balances: { ...current.balances, [currentUserId]: (current.balances[currentUserId] ?? 0) - amount },
      transactions: [entry, ...current.transactions],
    }));
    return null;
  }, [currentUserId, state.balances]);

  const notifyDeparture = useCallback<Store["notifyDeparture"]>(async (bookingId, at, place, note) => {
    let error: string | null = null;
    setState((current) => {
      const booking = current.bookings.find((item) => item.id === bookingId);
      if (!booking?.payment || booking.status !== "ACCEPTED" || booking.payment.status !== "HELD") {
        error = "The payment must be held before departure can be recorded.";
        return current;
      }
      const when = new Date(at);
      if (Number.isNaN(when.getTime())) {
        error = "Enter a valid departure date and time.";
        return current;
      }
      const point = positionAt(booking.pickupLocation, booking.destination, 0);
      const update = pushUpdate(current, partyIds(current, booking), "Trip departed", `${booking.pickupLocation} to ${booking.destination} left at ${when.toLocaleString("en-GB")}.`, `/dashboard/tracking/${bookingId}`, "info", "Recorded departure", place, current.currentUserId);
      return {
        ...current,
        ...update,
        bookings: current.bookings.map((item) => item.id === bookingId ? { ...booking, status: "IN_PROGRESS" } : item),
        notices: [{ id: uid("notice"), bookingId, kind: "DEPARTURE", at: when.toISOString(), place, note }, ...current.notices],
        pings: [{
          id: uid("ping"),
          bookingId,
          kmFromStart: 0,
          lat: point.lat,
          lng: point.lng,
          label: place || booking.pickupLocation,
          recordedAt: when.toISOString(),
          kind: "DEPARTURE",
          note,
        }, ...current.pings],
      };
    });
    return error;
  }, []);

  const notifyRest = useCallback<Store["notifyRest"]>(async (bookingId, at, place, note) => {
    let error: string | null = null;
    setState((current) => {
      const booking = current.bookings.find((item) => item.id === bookingId);
      if (!booking || booking.status !== "IN_PROGRESS") {
        error = "Rest stops are recorded while the trip is on the road.";
        return current;
      }
      const when = new Date(at);
      if (Number.isNaN(when.getTime()) || !place.trim()) {
        error = "Enter the rest time and place.";
        return current;
      }
      const lastKm = current.pings.filter((ping) => ping.bookingId === bookingId).reduce((max, ping) => Math.max(max, ping.kmFromStart), 0);
      const point = positionAt(booking.pickupLocation, booking.destination, lastKm);
      const update = pushUpdate(current, partyIds(current, booking), "Rest stop recorded", `${place} on ${booking.pickupLocation} to ${booking.destination}.`, `/dashboard/tracking/${bookingId}`, "warn", "Logged a rest stop", place, current.currentUserId);
      return {
        ...current,
        ...update,
        notices: [{ id: uid("notice"), bookingId, kind: "REST", at: when.toISOString(), place: place.trim(), note }, ...current.notices],
        pings: [{
          id: uid("ping"),
          bookingId,
          kmFromStart: lastKm,
          lat: point.lat,
          lng: point.lng,
          label: place.trim(),
          recordedAt: when.toISOString(),
          kind: "REST",
          note,
        }, ...current.pings],
      };
    });
    return error;
  }, []);

  const notifyResume = useCallback<Store["notifyResume"]>(async (bookingId, note) => {
    let error: string | null = null;
    setState((current) => {
      const booking = current.bookings.find((item) => item.id === bookingId);
      if (!booking || booking.status !== "IN_PROGRESS") {
        error = "Resume is recorded during an active trip.";
        return current;
      }
      const now = new Date().toISOString();
      const last = [...current.pings].reverse().find((ping) => ping.bookingId === bookingId);
      const update = pushUpdate(current, partyIds(current, booking), "Trip resumed", note, `/dashboard/tracking/${bookingId}`, "info", "Resumed after rest", booking.destination, current.currentUserId);
      return {
        ...current,
        ...update,
        notices: [{ id: uid("notice"), bookingId, kind: "RESUME", at: now, place: last?.label || booking.pickupLocation, note }, ...current.notices],
      };
    });
    return error;
  }, []);

  const recordCheckpoint = useCallback<Store["recordCheckpoint"]>(async (bookingId) => {
    let error: string | null = null;
    setState((current) => {
      const booking = current.bookings.find((item) => item.id === bookingId);
      if (!booking || booking.status !== "IN_PROGRESS") {
        error = "Checkpoints are recorded after departure.";
        return current;
      }
      const lastKm = current.pings.filter((ping) => ping.bookingId === bookingId).reduce((max, ping) => Math.max(max, ping.kmFromStart), 0);
      const nextKm = lastKm + 2;
      const point = positionAt(booking.pickupLocation, booking.destination, nextKm);
      if (nextKm > point.totalKm) {
        error = "The recorded trail has reached the destination. Confirm delivery instead.";
        return current;
      }
      const now = new Date().toISOString();
      const update = pushUpdate(current, partyIds(current, booking), "Location updated", `${nextKm} km recorded on ${booking.pickupLocation} to ${booking.destination}.`, `/dashboard/tracking/${bookingId}`, "info", "Recorded a checkpoint", `${nextKm} km`, current.currentUserId);
      return {
        ...current,
        ...update,
        pings: [{
          id: uid("ping"),
          bookingId,
          kmFromStart: nextKm,
          lat: point.lat,
          lng: point.lng,
          label: `${nextKm} km from ${booking.pickupLocation}`,
          recordedAt: now,
          kind: "CHECKPOINT",
        }, ...current.pings],
      };
    });
    return error;
  }, []);

  const refundBooking = useCallback<Store["refundBooking"]>(async (bookingId, reason) => {
    let error: string | null = null;
    setState((current) => {
      const actor = current.users.find((user) => user.id === current.currentUserId);
      if (actor?.role !== "ADMIN") {
        error = "Only an administrator can refund a held payment.";
        return current;
      }
      const booking = current.bookings.find((item) => item.id === bookingId);
      if (!booking?.payment || booking.payment.status === "RELEASED" || booking.payment.status === "REFUNDED") {
        error = "This payment is no longer refundable.";
        return current;
      }
      const now = new Date().toISOString();
      const route = `${booking.pickupLocation} to ${booking.destination}`;
      const update = pushUpdate(current, partyIds(current, booking), "Payment refunded", `${formatRwf(booking.payment.amountRwf)} for ${route} was returned to ${booking.payment.accountMask}.`, `/dashboard/tracking/${bookingId}`, "warn", "Refunded escrow", reason, current.currentUserId);
      return {
        ...current,
        ...update,
        bookings: current.bookings.map((item) => item.id === bookingId ? { ...booking, status: "REJECTED", payment: { ...booking.payment!, status: "REFUNDED", refundedAt: now } } : item),
        trucks: current.trucks.map((item) => item.id === booking.truckId ? { ...item, status: "AVAILABLE" } : item),
        disputes: current.disputes.map((dispute) => dispute.bookingId === bookingId && dispute.status === "OPEN"
          ? { ...dispute, status: "RESOLVED", resolutionNotes: reason, resolvedAt: now }
          : dispute),
      };
    });
    return error;
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((item) => item.id === id ? { ...item, read: true } : item),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    if (!currentUserId) return;
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((item) => item.userId === currentUserId ? { ...item, read: true } : item),
    }));
  }, [currentUserId]);

  const value = useMemo<Store>(() => ({
    ready,
    currentUser,
    users: state.users,
    bookings: state.bookings,
    disputes: state.disputes,
    trucks: state.trucks.filter(
      (truck) => currentUser?.role !== "TRUCK_OWNER" || truck.ownerId === currentUser.id,
    ),
    trucksLoading: false,
    walletBalance: currentUserId ? state.balances[currentUserId] ?? 0 : 0,
    transactions: state.transactions.filter(
      (entry) => !entry.userId || entry.userId === currentUserId,
    ),
    walletAccounts: currentUser?.role === "ADMIN"
    ? state.users.map((user) => ({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      balance: state.balances[user.id] ?? 0,
      transactions: state.transactions.filter((entry) => entry.userId === user.id),
    }))
    : [],
    login,
    requestPasswordReset,
    resetPassword,
    register,
    logout,
    updateProfile,
    fetchTruck,
    addTruck,
    updateTruck,
    deleteTruck,
    setAvailability,
    createBooking,
    setBookingStatus,
    reportProblem,
    resolveDispute,
    setUserActive,
    deleteUser,
    resetWorkspace,
    depositFunds,
    withdrawFunds,
    notifications: state.notifications.filter((item) => item.userId === currentUserId),
    activity: state.activity,
    pings: state.pings,
    notices: state.notices,
    escrowRwf: state.bookings.reduce((sum, booking) => sum + (booking.payment?.status === "HELD" ? booking.payment.amountRwf : 0), 0),
    notifyDeparture,
    notifyRest,
    notifyResume,
    recordCheckpoint,
    refundBooking,
    markNotificationRead,
    markAllNotificationsRead,
  }), [
    ready, currentUser, currentUserId, state, login, requestPasswordReset,
    resetPassword, register, logout, updateProfile, fetchTruck,
    addTruck, updateTruck, deleteTruck, setAvailability, createBooking,
    setBookingStatus, reportProblem, resolveDispute, setUserActive, deleteUser,
    resetWorkspace, depositFunds, withdrawFunds, notifyDeparture, notifyRest,
    notifyResume, recordCheckpoint, refundBooking, markNotificationRead, markAllNotificationsRead,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useIbanga() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useIbanga must be used inside IbangaProvider");
  return context;
}

export function dashboardPath(role: Role) {
  if (role === "ADMIN") return "/dashboard/admin";
  if (role === "TRUCK_OWNER") return "/dashboard/owner";
  return "/dashboard/importer";
}
