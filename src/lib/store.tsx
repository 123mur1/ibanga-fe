"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import { ACTIVE_BOOKING_STATUSES } from "./types";
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
};

const STORAGE_KEY = "ibanga-app-state-v4";
const initialState: AppState = {
  seedVersion,
  users: seedUsers,
  bookings: seedBookings,
  disputes: seedDisputes,
  trucks: seedTrucks,
  currentUserId: null,
  balances: Object.fromEntries(seedUsers.map((user) => [user.id, 600000 + seedUsers.indexOf(user) * 175000])),
  transactions: seedWalletTransactions,
  credentials: Object.fromEntries(seedUsers.map((user) => [
    user.email.toLowerCase(),
    user.email.toLowerCase() === "admin@ibanga.com" ? administratorPassword : accountPassword,
  ])),
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
  createBooking: (truck: Truck, input: NewBookingInput) => Promise<string | null>;
  setBookingStatus: (id: string, status: BookingStatus) => Promise<string | null>;
  reportProblem: (bookingId: string, reason: string) => Promise<string | null>;
  resolveDispute: (disputeId: string, notes: string) => Promise<string | null>;
  setUserActive: (userId: string, active: boolean) => void;
  deleteUser: (userId: string) => string | null;
  resetWorkspace: () => Promise<string | null>;
  depositFunds: (amount: number) => string | null;
  withdrawFunds: (amount: number) => string | null;
  payBooking: (bookingId: string) => string | null;
};

const StoreContext = createContext<Store | null>(null);

function freshWorkspace(): AppState {
  return {
    ...initialState,
    users: seedUsers.map((user) => ({ ...user })),
    bookings: seedBookings.map((booking) => ({ ...booking })),
    disputes: seedDisputes.map((dispute) => ({ ...dispute })),
    trucks: seedTrucks.map((truck) => ({ ...truck, photos: [...truck.photos] })),
    balances: { ...initialState.balances },
    transactions: initialState.transactions.map((transaction) => ({ ...transaction })),
    credentials: { ...initialState.credentials },
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
            users: mergeSeedRecords(seedUsers, parsed.users, includeNewSeeds),
            bookings: mergeSeedRecords(seedBookings, parsed.bookings, includeNewSeeds),
            disputes: mergeSeedRecords(seedDisputes, parsed.disputes, includeNewSeeds),
            trucks: mergeSeedRecords(seedTrucks, parsed.trucks, includeNewSeeds),
            balances: { ...initialState.balances, ...parsed.balances },
            transactions: mergeSeedRecords(
              seedWalletTransactions,
              parsed.transactions,
              includeNewSeeds,
            ),
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
    if (state.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
      return "An account with this email already exists.";
    }
    const user: User = {
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
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

  const createBooking = useCallback<Store["createBooking"]>(async (truck, input) => {
    if (!currentUserId) return "Sign in to book a truck.";
    const currentUser = state.users.find((user) => user.id === currentUserId);
    if (currentUser?.role !== "IMPORTER") {
      return "Only importer accounts can book trucks.";
    }
    const booking: Booking = {
      ...input,
      id: `booking-${Date.now()}`,
      importerId: currentUserId,
      truckId: truck.id,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    setState((current) => ({
      ...current,
      bookings: [booking, ...current.bookings],
      trucks: current.trucks.map((item) => item.id === truck.id ? { ...item, status: "UNAVAILABLE" } : item),
    }));
    return null;
  }, [currentUserId, state.users]);

  const setBookingStatus = useCallback<Store["setBookingStatus"]>(async (id, status) => {
    setState((current) => {
      const booking = current.bookings.find((item) => item.id === id);
      return {
        ...current,
        bookings: current.bookings.map((item) =>
          item.id === id
            ? { ...item, status, agreedPrice: item.agreedPrice || "RWF 850,000", agreedPriceRwf: item.agreedPriceRwf ?? 850000 }
            : item,
        ),
        trucks: booking && (status === "REJECTED" || status === "COMPLETED")
          ? current.trucks.map((item) => item.id === booking.truckId ? { ...item, status: "AVAILABLE" } : item)
          : current.trucks,
      };
    });
    return null;
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

  const payBooking = useCallback((bookingId: string) => {
    if (!currentUserId) return "Sign in to pay for a booking.";
    const booking = state.bookings.find((item) => item.id === bookingId);
    if (!booking || booking.importerId !== currentUserId) return "Booking not found.";
    const amount = booking.agreedPriceRwf ?? 850000;
    if ((state.balances[currentUserId] ?? 0) < amount) return "Insufficient wallet balance.";
    const entry = transaction(currentUserId, "BOOKING_PAYMENT", "DEBIT", amount, `Payment for ${booking.id}`);
    setState((current) => ({
      ...current,
      balances: { ...current.balances, [currentUserId]: (current.balances[currentUserId] ?? 0) - amount },
      transactions: [entry, ...current.transactions],
      bookings: current.bookings.map((item) =>
        item.id === bookingId
          ? { ...item, payment: { status: "FUNDED", amountRwf: amount, commissionRwf: Math.round(amount * 0.06), ownerAmountRwf: Math.round(amount * 0.94), fundedAt: new Date().toISOString() } }
          : item,
      ),
    }));
    return null;
  }, [currentUserId, state.balances, state.bookings]);

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
    payBooking,
  }), [
    ready, currentUser, currentUserId, state, login, requestPasswordReset,
    resetPassword, register, logout, updateProfile, fetchTruck,
    addTruck, updateTruck, deleteTruck, setAvailability, createBooking,
    setBookingStatus, reportProblem, resolveDispute, setUserActive, deleteUser,
    resetWorkspace, depositFunds, withdrawFunds, payBooking,
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
