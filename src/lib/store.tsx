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
<<<<<<< HEAD
  api,
  ApiError,
  clearAuthToken,
  readAuthToken,
  saveAuthToken,
} from "./api";
=======
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
>>>>>>> dd35b1a (feat: addressing comments regarding payments and dashboads refinment)
import type {
  ActivityEntry,
  AppNotification,
  Booking,
  BookingPayment,
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

<<<<<<< HEAD
type ApiRelatedUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  role?: Role;
  active?: boolean;
  company?: string | null;
  photo?: string | null;
  createdAt?: string;
};

type ApiUser = ApiRelatedUser & { role: Role };
type ApiOwner = ApiRelatedUser;

type ApiTruck = Omit<Truck, "currentLocation" | "preferredRoute" | "description" | "photos" | "owner"> & {
  currentLocation: string | null;
  preferredRoute: string | null;
  description: string | null;
  photos: string[];
  owner?: ApiOwner;
};

type ApiBooking = Omit<
  Booking,
  "cargoWeight" | "cargoDescription" | "additionalInstructions" | "agreedPrice" | "payment" | "dispute"
> & {
  cargoWeight: number;
  cargoDescription: string | null;
  additionalInstructions: string | null;
  agreedPrice: string;
  agreedPriceRwf: number | null;
  payment: BookingPayment | null;
  dispute: ApiDispute | null;
  truck: ApiTruck;
  importer: ApiRelatedUser;
};

type ApiDispute = Omit<Dispute, "resolutionNotes"> & {
  resolutionNotes: string | null;
};

type ApiWallet = {
  balanceRwf: number;
  transactions: Omit<WalletTransaction, "userId">[];
};

type ApiAdminWalletAccount = {
  userId: string;
  name: string;
  email: string;
  role: Role;
  balanceRwf: number;
  transactions: Omit<WalletTransaction, "userId">[];
};

type WalletAccount = {
  userId: string;
  name: string;
  email: string;
  role: Role;
  balance: number;
  transactions: WalletTransaction[];
};

type AdminCommission = {
  availableRwf: number;
  totalEarnedRwf: number;
  currency: string;
  monthlyHistory: { month: string; totalRwf: number }[];
=======
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
<<<<<<< HEAD
>>>>>>> dd35b1a (feat: addressing comments regarding payments and dashboads refinment)
=======
>>>>>>> backup-before-rebase
};

type Store = {
  ready: boolean;
  connectionError: string | null;
  currentUser: User | null;
  users: User[];
  bookings: Booking[];
  disputes: Dispute[];
  trucks: Truck[];
  trucksLoading: boolean;
  walletBalance: number;
  transactions: WalletTransaction[];
  walletAccounts: WalletAccount[];
  adminCommission: AdminCommission | null;
  login: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
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
<<<<<<< HEAD
  setUserActive: (userId: string, active: boolean) => Promise<string | null>;
  deleteUser: (userId: string) => Promise<string | null>;
  depositFunds: (amount: number, phoneNumber: string) => Promise<string | null>;
  withdrawFunds: (input: {
    amountRwf: number;
    method: "MOBILE_MONEY" | "BANK";
    beneficiaryName: string;
    phoneNumber?: string;
    bankCode?: string;
    branchCode?: string;
    accountNumber?: string;
  }) => Promise<string | null>;
  payBooking: (bookingId: string) => Promise<string | null>;
=======
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
<<<<<<< HEAD
>>>>>>> dd35b1a (feat: addressing comments regarding payments and dashboads refinment)
=======
>>>>>>> backup-before-rebase
};

const StoreContext = createContext<Store | null>(null);

function mapUser(user: ApiRelatedUser, role: Role = user.role ?? "IMPORTER"): User {
  return {
<<<<<<< HEAD
    ...user,
    phone: user.phone ?? "",
    location: user.location ?? "",
    company: user.company ?? undefined,
    photo: user.photo ?? undefined,
    role,
    active: user.active ?? true,
=======
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
<<<<<<< HEAD
>>>>>>> dd35b1a (feat: addressing comments regarding payments and dashboads refinment)
=======
>>>>>>> backup-before-rebase
  };
}

function mapTruck(truck: ApiTruck): Truck {
  return {
    ...truck,
    currentLocation: truck.currentLocation ?? "",
    preferredRoute: truck.preferredRoute ?? "",
    description: truck.description ?? "",
    photos: truck.photos ?? [],
    owner: truck.owner
      ? {
          id: truck.owner.id,
          name: truck.owner.name,
          email: truck.owner.email,
          phone: truck.owner.phone,
          location: truck.owner.location,
          photo: truck.owner.photo,
        }
      : undefined,
  };
}

<<<<<<< HEAD
function mapBooking(booking: ApiBooking): Booking {
=======
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
>>>>>>> dd35b1a (feat: addressing comments regarding payments and dashboads refinment)
  return {
    ...booking,
    status: booking.payment?.status === "RELEASED" ? "COMPLETED" : booking.status,
    cargoWeight: String(booking.cargoWeight),
    cargoDescription: booking.cargoDescription ?? "",
    additionalInstructions: booking.additionalInstructions ?? "",
    agreedPrice: booking.agreedPrice ?? "",
    payment: booking.payment ?? null,
    dispute: booking.dispute ? mapDispute(booking.dispute) : null,
  };
}

function mapDispute(dispute: ApiDispute): Dispute {
  return {
    ...dispute,
    resolutionNotes: dispute.resolutionNotes ?? "",
  };
}

function uniqueById<T extends { id: string }>(records: T[]) {
  return [...new Map(records.map((record) => [record.id, record])).values()];
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function IbangaProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [trucksLoading, setTrucksLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [walletAccounts, setWalletAccounts] = useState<WalletAccount[]>([]);
  const [adminCommission, setAdminCommission] =
    useState<AdminCommission | null>(null);

<<<<<<< HEAD
  const loadPublicTrucks = useCallback(async () => {
    setTrucksLoading(true);
    try {
      const records = await api<ApiTruck[]>("/trucks");
      setTrucks(records.map(mapTruck));
      setConnectionError(null);
    } catch (error) {
      const message = errorMessage(error, "Could not load available trucks.");
      setConnectionError(message);
      console.error("Could not load available trucks.", error);
    } finally {
      setTrucksLoading(false);
    }
=======
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
>>>>>>> dd35b1a (feat: addressing comments regarding payments and dashboads refinment)
  }, []);

  const loadMarketplace = useCallback(async (user: User) => {
    setTrucksLoading(true);
    try {
      const truckPath = user.role === "TRUCK_OWNER" ? "/trucks?mine=true" : "/trucks";
      const [truckRecords, bookingRecords, disputeRecords, wallet, adminUsers, adminWalletAccounts, commissionSummary] =
        await Promise.all([
          api<ApiTruck[]>(truckPath),
          api<ApiBooking[]>("/bookings"),
          api<ApiDispute[]>("/disputes"),
          api<ApiWallet>("/wallet"),
          user.role === "ADMIN" ? api<ApiUser[]>("/users") : Promise.resolve([]),
          user.role === "ADMIN"
            ? api<ApiAdminWalletAccount[]>("/wallet/admin/accounts")
            : Promise.resolve([]),
          user.role === "ADMIN"
            ? api<AdminCommission>("/wallet/admin/commission")
            : Promise.resolve(null),
        ]);

      const mappedBookings = bookingRecords.map(mapBooking);
      const mappedTrucks = truckRecords.map(mapTruck);
      const nestedTrucks = bookingRecords.map((booking) => mapTruck(booking.truck));
      const allTrucks = uniqueById([...mappedTrucks, ...nestedTrucks]);
      const mappedDisputes = disputeRecords.map(mapDispute);
      const mappedUsers = adminUsers.map((user) => mapUser(user));
      const relatedUsers = [
        ...bookingRecords.flatMap((booking) => [
          mapUser(booking.importer, "IMPORTER"),
          ...(booking.truck.owner ? [mapUser(booking.truck.owner, "TRUCK_OWNER")] : []),
        ]),
        ...mappedTrucks.flatMap((truck) =>
          truck.owner ? [mapUser(truck.owner, "TRUCK_OWNER")] : [],
        ),
      ];
      const allUsers = uniqueById([
        ...mappedUsers,
        ...relatedUsers,
        user,
      ]);

      setCurrentUser(user);
      setUsers(allUsers);
      setBookings(mappedBookings);
      setDisputes(mappedDisputes);
      setTrucks(allTrucks);
      setWalletBalance(wallet.balanceRwf);
      setTransactions(
        wallet.transactions.map((transaction) => ({
          ...transaction,
          userId: user.id,
        })),
      );
      setWalletAccounts(
        adminWalletAccounts.map((account) => ({
          userId: account.userId,
          name: account.name,
          email: account.email,
          role: account.role,
          balance: account.balanceRwf,
          transactions: account.transactions.map((transaction) => ({
            ...transaction,
            userId: account.userId,
          })),
        })),
      );
      setAdminCommission(commissionSummary);
      setConnectionError(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAuthToken();
        setCurrentUser(null);
        setUsers([]);
        setBookings([]);
        setDisputes([]);
        setTrucks([]);
        setWalletBalance(0);
        setTransactions([]);
        setWalletAccounts([]);
        setAdminCommission(null);
        await loadPublicTrucks();
        return;
      }
      setAdminCommission(null);
      const message = errorMessage(error, "Could not load marketplace data.");
      setConnectionError(message);
      console.error("Could not load marketplace data.", error);
    } finally {
      setTrucksLoading(false);
    }
  }, [loadPublicTrucks]);

  const refreshAfterMutation = useCallback(async () => {
    if (currentUser) {
      await loadMarketplace(currentUser);
    } else {
      await loadPublicTrucks();
    }
  }, [currentUser, loadMarketplace, loadPublicTrucks]);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        window.localStorage.removeItem("ibanga-app-state-v4");
        if (readAuthToken()) {
          try {
            const user = mapUser(await api<ApiUser>("/auth/me"));
            if (active) {
              setCurrentUser(user);
              await loadMarketplace(user);
            }
          } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
              clearAuthToken();
            } else {
              throw error;
            }
          }
        }
        if (active && !readAuthToken()) await loadPublicTrucks();
      } catch (error) {
        const message = errorMessage(error, "Could not connect to the iBanga API.");
        if (active) setConnectionError(message);
        console.error("Could not initialize the marketplace.", error);
      } finally {
        if (active) setReady(true);
      }
    }

    void initialize();
    return () => {
      active = false;
    };
  }, [loadMarketplace, loadPublicTrucks]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await api<{ token: string; user: ApiUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveAuthToken(result.token);
      const user = mapUser(result.user);
      setCurrentUser(user);
      await loadMarketplace(user);
      return { user, error: null };
    } catch (error) {
      return { user: null, error: errorMessage(error, "Could not sign in.") };
    }
  }, [loadMarketplace]);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      return await api<{ message: string }>("/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      return { message: "", error: errorMessage(error, "Could not request a password reset.") };
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
      return errorMessage(error, "Could not reset the password.");
    }
  }, []);

  const register = useCallback<Store["register"]>(async (input) => {
<<<<<<< HEAD
<<<<<<< HEAD
    try {
      const result = await api<{ token: string; user: ApiUser }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: input.name,
          email: input.email,
          phone: input.phone,
          location: input.location,
          password: input.password,
          role: input.role,
        }),
      });
      saveAuthToken(result.token);
      let user = mapUser(result.user);
      setCurrentUser(user);
      if (input.company.trim()) {
        try {
          user = mapUser(await api<ApiUser>("/auth/me", {
            method: "PATCH",
            body: JSON.stringify({ company: input.company }),
          }));
        } catch (error) {
          await loadMarketplace(user);
          return `Your account was created, but the company profile could not be saved: ${errorMessage(error, "API request failed.")}`;
        }
      }
      await loadMarketplace(user);
      return null;
    } catch (error) {
      return errorMessage(error, "Could not create your account.");
    }
  }, [loadMarketplace]);
=======
=======
>>>>>>> backup-before-rebase
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
>>>>>>> dd35b1a (feat: addressing comments regarding payments and dashboads refinment)

  const logout = useCallback(() => {
    clearAuthToken();
    setCurrentUser(null);
    setUsers([]);
    setBookings([]);
    setDisputes([]);
    setTrucks([]);
    setWalletBalance(0);
    setTransactions([]);
    setWalletAccounts([]);
    setAdminCommission(null);
    void loadPublicTrucks();
  }, [loadPublicTrucks]);

  const updateProfile = useCallback<Store["updateProfile"]>(async (patch) => {
    if (!currentUser) return "Sign in to update your profile.";
    try {
      const user = mapUser(await api<ApiUser>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(patch),
      }));
      await loadMarketplace(user);
      return null;
    } catch (error) {
      return errorMessage(error, "Could not update your profile.");
    }
  }, [currentUser, loadMarketplace]);

  const fetchTruck = useCallback<Store["fetchTruck"]>(async (id) => {
    const truck = await api<ApiTruck>(`/trucks/${encodeURIComponent(id)}`);
    return mapTruck(truck);
  }, []);

  const addTruck = useCallback<Store["addTruck"]>(async (input) => {
    if (!currentUser) return "Sign in to list a truck.";
    try {
      await api("/trucks", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await refreshAfterMutation();
      return null;
    } catch (error) {
      return errorMessage(error, "Could not add the truck.");
    }
  }, [currentUser, refreshAfterMutation]);

  const updateTruck = useCallback<Store["updateTruck"]>(async (id, patch) => {
    try {
      await api(`/trucks/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      await refreshAfterMutation();
      return null;
    } catch (error) {
      return errorMessage(error, "Could not update the truck.");
    }
  }, [refreshAfterMutation]);

  const deleteTruck = useCallback<Store["deleteTruck"]>(async (id) => {
    try {
      await api(`/trucks/${encodeURIComponent(id)}`, { method: "DELETE" });
      await refreshAfterMutation();
      return null;
    } catch (error) {
      return errorMessage(error, "Could not remove the truck.");
    }
  }, [refreshAfterMutation]);

  const setAvailability = useCallback<Store["setAvailability"]>(async (id, status) => {
    try {
      await api(`/trucks/${encodeURIComponent(id)}/availability`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refreshAfterMutation();
      return null;
    } catch (error) {
      return errorMessage(error, "Could not update truck availability.");
    }
  }, [refreshAfterMutation]);

<<<<<<< HEAD
<<<<<<< HEAD
  const createBooking = useCallback<Store["createBooking"]>(async (truck, input) => {
    if (!currentUser) return "Sign in to book a truck.";
    try {
      const cargoWeight = Number(input.cargoWeight);
      if (!Number.isFinite(cargoWeight) || cargoWeight <= 0) {
        return "Enter a valid cargo weight.";
      }
      await api("/bookings", {
        method: "POST",
        body: JSON.stringify({
          truckId: truck.id,
          cargoType: input.cargoType,
          cargoDescription: input.cargoDescription,
          cargoWeight,
          pickupLocation: input.pickupLocation,
          destination: input.destination,
          pickupDate: input.pickupDate,
          expectedDeliveryDate: input.expectedDeliveryDate,
          additionalInstructions: input.additionalInstructions,
        }),
      });
      await refreshAfterMutation();
      return null;
    } catch (error) {
      return errorMessage(error, "Could not create the booking.");
    }
  }, [currentUser, refreshAfterMutation]);

  const setBookingStatus = useCallback<Store["setBookingStatus"]>(async (id, status) => {
    try {
      await api(`/bookings/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refreshAfterMutation();
      return null;
    } catch (error) {
      return errorMessage(error, "Could not update the booking.");
    }
  }, [refreshAfterMutation]);
=======
  const createBooking = useCallback<Store["createBooking"]>(async (truck, input, checkout) => {
    if (!currentUserId) return "Sign in to book a truck.";
    const importer = state.users.find((user) => user.id === currentUserId);
    if (importer?.role !== "IMPORTER") return "Only importer accounts can book trucks.";
    if (!["VISA", "AIRTEL", "MTN"].includes(checkout.method)) {
      return "Pay with a Visa card, Airtel Money, or MTN MoMo.";
    }
=======
  const createBooking = useCallback<Store["createBooking"]>(async (truck, input, checkout) => {
    if (!currentUserId) return "Sign in to book a truck.";
    const importer = state.users.find((user) => user.id === currentUserId);
    if (importer?.role !== "IMPORTER") return "Only importer accounts can book trucks.";
    if (!["VISA", "AIRTEL", "MTN"].includes(checkout.method)) {
      return "Pay with a Visa card, Airtel Money, or MTN MoMo.";
    }
>>>>>>> backup-before-rebase
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
>>>>>>> dd35b1a (feat: addressing comments regarding payments and dashboads refinment)

  const reportProblem = useCallback<Store["reportProblem"]>(async (bookingId, reason) => {
    try {
      await api("/disputes", {
        method: "POST",
        body: JSON.stringify({ bookingId, reason }),
      });
      await refreshAfterMutation();
      return null;
    } catch (error) {
      return errorMessage(error, "Could not report the booking problem.");
    }
  }, [refreshAfterMutation]);

  const resolveDispute = useCallback<Store["resolveDispute"]>(async (disputeId, notes) => {
    try {
      await api(`/disputes/${encodeURIComponent(disputeId)}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ resolutionNotes: notes }),
      });
      await refreshAfterMutation();
      return null;
    } catch (error) {
      return errorMessage(error, "Could not resolve the dispute.");
    }
  }, [refreshAfterMutation]);

  const setUserActive = useCallback<Store["setUserActive"]>(async (userId, active) => {
    try {
      await api(`/users/${encodeURIComponent(userId)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ active }),
      });
      await refreshAfterMutation();
      return null;
    } catch (error) {
      return errorMessage(error, "Could not update the account status.");
    }
  }, [refreshAfterMutation]);

  const deleteUser = useCallback<Store["deleteUser"]>(async (userId) => {
    try {
      await api(`/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
      await refreshAfterMutation();
      return null;
    } catch (error) {
      return errorMessage(error, "Could not remove the account.");
    }
  }, [refreshAfterMutation]);

  const depositFunds = useCallback<Store["depositFunds"]>(async (amount, phoneNumber) => {
    try {
      await api("/wallet/deposits", {
        method: "POST",
        body: JSON.stringify({ amountRwf: amount, phoneNumber }),
      });
      await refreshAfterMutation();
      return null;
    } catch (error) {
      return errorMessage(error, "Could not deposit funds.");
    }
  }, [refreshAfterMutation]);

<<<<<<< HEAD
  const withdrawFunds = useCallback<Store["withdrawFunds"]>(async (input) => {
    try {
      await api("/wallet/withdrawals", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await refreshAfterMutation();
      return null;
    } catch (error) {
      return errorMessage(error, "Could not withdraw funds.");
    }
  }, [refreshAfterMutation]);

  const payBooking = useCallback<Store["payBooking"]>(async (bookingId) => {
    try {
      await api(`/wallet/bookings/${encodeURIComponent(bookingId)}/pay`, {
        method: "POST",
      });
      await refreshAfterMutation();
      return null;
    } catch (error) {
      return errorMessage(error, "Could not pay for the booking.");
    }
  }, [refreshAfterMutation]);
=======
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
<<<<<<< HEAD
>>>>>>> dd35b1a (feat: addressing comments regarding payments and dashboads refinment)
=======

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
>>>>>>> backup-before-rebase

  const value = useMemo<Store>(() => ({
    ready,
    connectionError,
    currentUser,
    users,
    bookings,
    disputes,
    trucks,
    trucksLoading,
    walletBalance,
    transactions,
    walletAccounts,
    adminCommission,
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
<<<<<<< HEAD
    ready, connectionError, currentUser, users, bookings, disputes, trucks,
    trucksLoading, walletBalance, transactions, walletAccounts, adminCommission, login, requestPasswordReset,
    resetPassword, register, logout, updateProfile, fetchTruck, addTruck,
    updateTruck, deleteTruck, setAvailability, createBooking, setBookingStatus,
    reportProblem, resolveDispute, setUserActive, deleteUser,
    depositFunds, withdrawFunds, payBooking,
=======
    ready, currentUser, currentUserId, state, login, requestPasswordReset,
    resetPassword, register, logout, updateProfile, fetchTruck,
    addTruck, updateTruck, deleteTruck, setAvailability, createBooking,
    setBookingStatus, reportProblem, resolveDispute, setUserActive, deleteUser,
    resetWorkspace, depositFunds, withdrawFunds, notifyDeparture, notifyRest,
    notifyResume, recordCheckpoint, refundBooking, markNotificationRead, markAllNotificationsRead,
<<<<<<< HEAD
>>>>>>> dd35b1a (feat: addressing comments regarding payments and dashboads refinment)
=======
>>>>>>> backup-before-rebase
  ]);

  return (
    <StoreContext.Provider value={value}>
      {connectionError ? (
        <p role="alert" className="border-b border-bad/20 bg-bad-soft px-4 py-2 text-center text-sm text-bad">
          API connection: {connectionError}
        </p>
      ) : null}
      {children}
    </StoreContext.Provider>
  );
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
