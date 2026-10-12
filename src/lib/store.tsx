"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, clearAuthToken, readAuthToken, saveAuthToken } from "./api";
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
type UserProfilePatch = Partial<Pick<User, "name" | "phone" | "location" | "company" | "photo">>;
type WithdrawalInput = {
  amountRwf: number;
  method: "MOBILE_MONEY" | "BANK";
  beneficiaryName: string;
  phoneNumber?: string;
  bankCode?: string;
  branchCode?: string;
  accountNumber?: string;
};

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

type Store = {
  ready: boolean;
  loadError: string | null;
  usersLoadError: string | null;
  commissionLoadError: string | null;
  currentUser: User | null;
  users: User[];
  bookings: Booking[];
  disputes: Dispute[];
  trucks: Truck[];
  trucksLoading: boolean;
  walletBalance: number;
  transactions: WalletTransaction[];
  commissionAvailableRwf: number;
  commissionTotalEarnedRwf: number;
  login: (email: string, password: string) => Promise<string | null>;
  requestPasswordReset: (email: string) => Promise<{ message: string; error?: string } | null>;
  resetPassword: (token: string, password: string) => Promise<string | null>;
  register: (input: {
    name: string;
    email: string;
    phone: string;
    location: string;
    password: string;
    role: Exclude<Role, "ADMIN">;
  }) => Promise<string | null>;
  logout: () => void;
  updateProfile: (patch: UserProfilePatch) => Promise<string | null>;
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
  deleteUser: (userId: string) => Promise<string | null>;
  depositFunds: (amount: number, phoneNumber: string) => Promise<string | null>;
  withdrawFunds: (input: WithdrawalInput) => Promise<string | null>;
  payBooking: (bookingId: string) => Promise<string | null>;
  getBanks: () => Promise<{ id?: string; code?: string; name?: string }[]>;
  getBankBranches: (bankCode: string) => Promise<{ id?: string; code?: string; name?: string }[]>;
};

type AppState = {
  currentUser: User | null;
  users: User[];
  usersLoadError: string | null;
  commissionLoadError: string | null;
  bookings: Booking[];
  disputes: Dispute[];
  trucks: Truck[];
  walletBalance: number;
  transactions: WalletTransaction[];
  commissionAvailableRwf: number;
  commissionTotalEarnedRwf: number;
};

type RawUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: Role;
  location?: string | null;
  company?: string | null;
  photo?: string | null;
  createdAt?: string;
};

type RawTruck = Omit<Truck, "currentLocation" | "preferredRoute" | "description" | "owner"> & {
  currentLocation?: string | null;
  preferredRoute?: string | null;
  description?: string | null;
  owner?: RawUser | null;
};

type RawBooking = Omit<
  Booking,
  "cargoWeight" | "cargoDescription" | "additionalInstructions" | "agreedPrice" |
    "pickupDate" | "expectedDeliveryDate" | "payment" | "dispute" | "importer" | "truck"
> & {
  cargoWeight: number;
  cargoDescription?: string | null;
  additionalInstructions?: string | null;
  agreedPrice?: string | null;
  agreedPriceRwf?: number | null;
  pickupDate: string;
  expectedDeliveryDate: string;
  importer?: RawUser;
  truck?: RawTruck;
  payment?: Booking["payment"];
  dispute?: RawDispute | null;
};

type RawDispute = Omit<Dispute, "resolutionNotes" | "resolvedAt"> & {
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  booking?: RawBooking;
};

type AuthPayload = { token: string; user: RawUser };
type RawWallet = {
  balanceRwf: number;
  transactions: WalletTransaction[];
};
type RawCommission = { availableRwf: number; totalEarnedRwf: number };
type RawBank = { id?: string; code?: string; name?: string };

const StoreContext = createContext<Store | null>(null);

function emptyState(currentUser: User | null = null): AppState {
  return {
    currentUser,
    users: [],
    usersLoadError: null,
    commissionLoadError: null,
    bookings: [],
    disputes: [],
    trucks: [],
    walletBalance: 0,
    transactions: [],
    commissionAvailableRwf: 0,
    commissionTotalEarnedRwf: 0,
  };
}

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "The API request failed.";
}

function toUser(user: RawUser, roleFallback?: Role): User {
  const role = user.role ?? roleFallback;
  if (!role) {
    throw new Error(`User ${user.id} returned by the API is missing a role.`);
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    role,
    location: user.location ?? "",
    company: user.company ?? undefined,
    photo: user.photo ?? undefined,
    createdAt: user.createdAt,
  };
}

function toTruck(truck: RawTruck): Truck {
  return {
    ...truck,
    currentLocation: truck.currentLocation ?? "",
    preferredRoute: truck.preferredRoute ?? "",
    description: truck.description ?? "",
    photos: truck.photos ?? [],
    owner: truck.owner ? toUser(truck.owner, "TRUCK_OWNER") : undefined,
  };
}

function toDateInput(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
}

function toBooking(booking: RawBooking): Booking {
  const price = booking.agreedPriceRwf;
  const relatedDispute = booking.dispute
    ? toDispute(booking.dispute)
    : undefined;
  return {
    id: booking.id,
    truckId: booking.truckId,
    importerId: booking.importerId,
    cargoType: booking.cargoType,
    cargoDescription: booking.cargoDescription ?? "",
    cargoWeight: `${booking.cargoWeight} tons`,
    pickupLocation: booking.pickupLocation,
    destination: booking.destination,
    pickupDate: toDateInput(booking.pickupDate),
    expectedDeliveryDate: toDateInput(booking.expectedDeliveryDate),
    additionalInstructions: booking.additionalInstructions ?? "",
    agreedPrice: booking.agreedPrice ?? (price == null ? "" : `RWF ${price.toLocaleString("en-RW")}`),
    agreedPriceRwf: price,
    payment: booking.payment ?? null,
    dispute: relatedDispute,
    status: booking.status,
    createdAt: booking.createdAt,
    importer: booking.importer ? toUser(booking.importer, "IMPORTER") : undefined,
    truck: booking.truck ? toTruck(booking.truck) : undefined,
  };
}

function toDispute(dispute: RawDispute): Dispute {
  return {
    id: dispute.id,
    bookingId: dispute.bookingId,
    raisedBy: dispute.raisedBy,
    reason: dispute.reason,
    status: dispute.status,
    resolutionNotes: dispute.resolutionNotes ?? "",
    createdAt: dispute.createdAt,
    resolvedAt: dispute.resolvedAt ?? undefined,
  };
}

function toTransaction(entry: WalletTransaction, userId: string): WalletTransaction {
  return { ...entry, userId };
}

function mergeUsers(...groups: (User | undefined)[][]): User[] {
  const users = new Map<string, User>();
  for (const group of groups) {
    for (const user of group) {
      if (user) users.set(user.id, { ...users.get(user.id), ...user });
    }
  }
  return [...users.values()];
}

export function IbangaProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => emptyState());
  const [ready, setReady] = useState(false);
  const [trucksLoading, setTrucksLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshMarketplace = useCallback(async (user: User | null) => {
    setTrucksLoading(true);
    const isAdmin = user?.role === "ADMIN";
    const truckPath = user?.role === "TRUCK_OWNER" ? "/trucks?mine=true" : "/trucks";
    try {
      const [rawTrucks, rawBookings, rawDisputes, usersResult, wallet, commissionResult] =
        await Promise.all([
          api<RawTruck[]>(truckPath),
          user ? api<RawBooking[]>("/bookings") : Promise.resolve([]),
          user ? api<RawDispute[]>("/disputes") : Promise.resolve([]),
          isAdmin
            ? api<RawUser[]>("/users").then(
                (users) => ({ users, error: null }),
                (error: unknown) => ({ users: [], error: messageFrom(error) }),
              )
            : Promise.resolve({ users: [], error: null }),
          user ? api<RawWallet>("/wallet") : Promise.resolve(null),
          isAdmin
            ? api<RawCommission>("/wallet/admin/commission").then(
                (commission) => ({ commission, error: null }),
                (error: unknown) => ({ commission: null, error: messageFrom(error) }),
              )
            : Promise.resolve({ commission: null, error: null }),
        ]);

      const rawUsers = usersResult.users;
      const trucks = rawTrucks.map(toTruck);
      const bookings = rawBookings.map(toBooking);
      const disputes = rawDisputes.map(toDispute);
      const users = mergeUsers(
        [user ?? undefined],
        rawTrucks.map((truck) =>
          truck.owner ? toUser(truck.owner, "TRUCK_OWNER") : undefined,
        ),
        rawBookings.map((booking) =>
          booking.importer ? toUser(booking.importer, "IMPORTER") : undefined,
        ),
        rawUsers.map((rawUser) => toUser(rawUser)),
      );
      const transactions = wallet && user
        ? wallet.transactions.map((entry) => toTransaction(entry, user.id))
        : [];

      setState((current) => ({
        ...current,
        users,
        usersLoadError: usersResult.error,
        commissionLoadError: commissionResult.error,
        bookings,
        disputes,
        trucks,
        walletBalance: wallet?.balanceRwf ?? 0,
        transactions,
        commissionAvailableRwf: commissionResult.commission?.availableRwf ?? 0,
        commissionTotalEarnedRwf: commissionResult.commission?.totalEarnedRwf ?? 0,
      }));
      setLoadError(null);
    } catch (error) {
      const message = messageFrom(error);
      setLoadError(message);
      throw error;
    } finally {
      setTrucksLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      let user: User | null = null;
      const token = readAuthToken();
      if (token) {
        try {
          user = toUser(await api<RawUser>("/auth/me"));
        } catch (error) {
          if (error instanceof Error && "status" in error && error.status === 401) {
            clearAuthToken();
          } else {
            setLoadError(messageFrom(error));
          }
        }
      }
      if (!cancelled) setState((current) => ({ ...current, currentUser: user }));
      try {
        await refreshMarketplace(user);
      } catch {
        // The error is exposed through loadError for the page to display.
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void initialize();
    return () => {
      cancelled = true;
    };
  }, [refreshMarketplace]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await api<AuthPayload>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveAuthToken(result.token);
      const user = toUser(result.user);
      setState(emptyState(user));
      setReady(true);
      try {
        await refreshMarketplace(user);
      } catch {
        // Authentication succeeded; refreshMarketplace exposes the load error.
      }
      return null;
    } catch (error) {
      return messageFrom(error);
    }
  }, [refreshMarketplace]);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      return await api<{ message: string }>("/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      return { message: "", error: messageFrom(error) };
    }
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    try {
      await api("/auth/password-reset/reset", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      return null;
    } catch (error) {
      return messageFrom(error);
    }
  }, []);

  const register = useCallback<Store["register"]>(async (input) => {
    try {
      const result = await api<AuthPayload>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: input.name,
          email: input.email,
          password: input.password,
          phone: input.phone,
          location: input.location,
          role: input.role,
        }),
      });
      saveAuthToken(result.token);
      const user = toUser(result.user);
      setState(emptyState(user));
      setReady(true);
      try {
        await refreshMarketplace(user);
      } catch {
        // Authentication succeeded; refreshMarketplace exposes the load error.
      }
      return null;
    } catch (error) {
      return messageFrom(error);
    }
  }, [refreshMarketplace]);

  const logout = useCallback(() => {
    clearAuthToken();
    setState(emptyState());
    void refreshMarketplace(null).catch(() => undefined);
  }, [refreshMarketplace]);

  const updateProfile = useCallback<Store["updateProfile"]>(async (patch) => {
    try {
      const user = toUser(await api<RawUser>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(patch),
      }));
      setState((current) => ({
        ...current,
        currentUser: user,
        users: current.users.map((entry) => entry.id === user.id ? user : entry),
      }));
      return null;
    } catch (error) {
      return messageFrom(error);
    }
  }, []);

  const fetchTruck = useCallback(async (id: string) => {
    return toTruck(await api<RawTruck>(`/trucks/${encodeURIComponent(id)}`));
  }, []);

  const runMutation = useCallback(async (
    request: () => Promise<unknown>,
  ) => {
    try {
      await request();
      await refreshMarketplace(state.currentUser);
      return null;
    } catch (error) {
      return messageFrom(error);
    }
  }, [refreshMarketplace, state.currentUser]);

  const addTruck = useCallback<Store["addTruck"]>(async (input) =>
    runMutation(() => api("/trucks", {
      method: "POST",
      body: JSON.stringify(input),
    })), [runMutation]);

  const updateTruck = useCallback<Store["updateTruck"]>(async (id, patch) =>
    runMutation(() => api(`/trucks/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    })), [runMutation]);

  const deleteTruck = useCallback<Store["deleteTruck"]>(async (id) =>
    runMutation(() => api(`/trucks/${encodeURIComponent(id)}`, {
      method: "DELETE",
    })), [runMutation]);

  const setAvailability = useCallback<Store["setAvailability"]>(async (id, status) =>
    runMutation(() => api(`/trucks/${encodeURIComponent(id)}/availability`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })), [runMutation]);

  const createBooking = useCallback<Store["createBooking"]>(async (truck, input) =>
    runMutation(() => api("/bookings", {
      method: "POST",
      body: JSON.stringify({
        truckId: truck.id,
        cargoType: input.cargoType,
        cargoDescription: input.cargoDescription,
        cargoWeight: Number.parseFloat(input.cargoWeight),
        pickupLocation: input.pickupLocation,
        destination: input.destination,
        pickupDate: input.pickupDate,
        expectedDeliveryDate: input.expectedDeliveryDate,
        additionalInstructions: input.additionalInstructions,
      }),
    })), [runMutation]);

  const setBookingStatus = useCallback<Store["setBookingStatus"]>(async (id, status) =>
    runMutation(() => api(`/bookings/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })), [runMutation]);

  const reportProblem = useCallback<Store["reportProblem"]>(async (bookingId, reason) =>
    runMutation(() => api("/disputes", {
      method: "POST",
      body: JSON.stringify({ bookingId, reason }),
    })), [runMutation]);

  const resolveDispute = useCallback<Store["resolveDispute"]>(async (disputeId, resolutionNotes) =>
    runMutation(() => api(`/disputes/${encodeURIComponent(disputeId)}/resolve`, {
      method: "PATCH",
      body: JSON.stringify({ resolutionNotes }),
    })), [runMutation]);

  const deleteUser = useCallback<Store["deleteUser"]>(async (userId) =>
    runMutation(() => api(`/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    })), [runMutation]);

  const refreshWallet = useCallback(async () => {
    const [wallet, commission] = await Promise.all([
      api<RawWallet>("/wallet"),
      state.currentUser?.role === "ADMIN"
        ? api<RawCommission>("/wallet/admin/commission")
        : Promise.resolve(null),
    ]);
    const transactions = wallet.transactions.map((entry) =>
      toTransaction(entry, state.currentUser?.id ?? ""),
    );
    setState((current) => ({
      ...current,
      walletBalance: wallet.balanceRwf,
      transactions,
      commissionAvailableRwf: commission?.availableRwf ?? current.commissionAvailableRwf,
      commissionTotalEarnedRwf: commission?.totalEarnedRwf ?? current.commissionTotalEarnedRwf,
    }));
  }, [state.currentUser]);

  const depositFunds = useCallback<Store["depositFunds"]>(async (amount, phoneNumber) => {
    try {
      await api("/wallet/deposits", {
        method: "POST",
        body: JSON.stringify({ amountRwf: amount, phoneNumber }),
      });
      await refreshWallet();
      return null;
    } catch (error) {
      return messageFrom(error);
    }
  }, [refreshWallet]);

  const withdrawFunds = useCallback<Store["withdrawFunds"]>(async (input) => {
    try {
      await api("/wallet/withdrawals", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await refreshWallet();
      return null;
    } catch (error) {
      return messageFrom(error);
    }
  }, [refreshWallet]);

  const payBooking = useCallback<Store["payBooking"]>(async (bookingId) =>
    runMutation(() => api(`/wallet/bookings/${encodeURIComponent(bookingId)}/pay`, {
      method: "POST",
    })), [runMutation]);

  const getBanks = useCallback(() => api<RawBank[]>("/wallet/banks"), []);
  const getBankBranches = useCallback((bankCode: string) =>
    api<RawBank[]>(`/wallet/banks/${encodeURIComponent(bankCode)}/branches`), []);

  const value = useMemo<Store>(() => ({
    ready,
    loadError,
    usersLoadError: state.usersLoadError,
    commissionLoadError: state.commissionLoadError,
    currentUser: state.currentUser,
    users: state.users,
    bookings: state.bookings,
    disputes: state.disputes,
    trucks: state.trucks,
    trucksLoading,
    walletBalance: state.walletBalance,
    transactions: state.transactions,
    commissionAvailableRwf: state.commissionAvailableRwf,
    commissionTotalEarnedRwf: state.commissionTotalEarnedRwf,
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
    deleteUser,
    depositFunds,
    withdrawFunds,
    payBooking,
    getBanks,
    getBankBranches,
  }), [
    ready, loadError, state, trucksLoading, login, requestPasswordReset,
    resetPassword, register, logout, updateProfile, fetchTruck, addTruck,
    updateTruck, deleteTruck, setAvailability, createBooking, setBookingStatus,
    reportProblem, resolveDispute, deleteUser, depositFunds, withdrawFunds,
    payBooking, getBanks, getBankBranches,
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
