"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  api,
  apiUrl,
  ApiError,
  clearAuthToken,
  readAuthToken,
  saveAuthToken,
} from "./api";
import { loadOperationsSnapshot } from "@/services/api/operations-records";
import { mockDb } from "@/services/mock-db";
import {
  commissionFor,
  demoAddTruck,
  demoAddReview,
  demoAddUser,
  demoAuthenticate,
  demoCreateBooking,
  demoDeposit,
  demoEnabled,
  demoPayBooking,
  demoProcessRefund,
  demoRequestRefund,
  demoRegister,
  demoReportProblem,
  demoResolveDispute,
  demoSetAvailability,
  demoSetBookingStatus,
  demoUpdateTruck,
  demoWithdraw,
  loadDemoSession,
  saveDemoSession,
  walletAccountsFor,
  walletBalanceFor,
  type DemoSession,
} from "./demo";
import type {
  Booking,
  BookingPayment,
  BookingStatus,
  CheckoutDetails,
  Dispute,
  RefundRequest,
  Review,
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

type ApiTruck = Omit<
  Truck,
  "currentLocation" | "preferredRoute" | "description" | "photos" | "owner"
> & {
  currentLocation: string | null;
  preferredRoute: string | null;
  description: string | null;
  photos: string[];
  owner?: ApiOwner;
};

type ApiBooking = Omit<
  Booking,
  | "cargoWeight"
  | "cargoDescription"
  | "additionalInstructions"
  | "agreedPrice"
  | "payment"
  | "dispute"
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
};

type Store = {
  ready: boolean;
  connectionError: string | null;
  refreshMarketplace: () => Promise<void>;
  currentUser: User | null;
  users: User[];
  bookings: Booking[];
  disputes: Dispute[];
  refunds: RefundRequest[];
  reviews: Review[];
  trucks: Truck[];
  trucksLoading: boolean;
  walletBalance: number;
  transactions: WalletTransaction[];
  walletAccounts: WalletAccount[];
  adminCommission: AdminCommission | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ user: User | null; error: string | null }>;
  requestPasswordReset: (
    email: string,
  ) => Promise<{ message: string; error?: string } | null>;
  resetPassword: (token: string, password: string) => Promise<string | null>;
  register: (input: {
    name: string;
    email: string;
    phone: string;
    location: string;
    company: string;
    password: string;
    role: Exclude<Role, "ADMIN" | "DRIVER">;
  }) => Promise<string | null>;
  logout: () => void;
  addUser: (input: {
    id?: string;
    name: string;
    email: string;
    phone: string;
    role: Role;
    location: string;
    company: string;
    password: string;
  }) => Promise<string | null>;
  updateProfile: (
    patch: Partial<
      Pick<User, "name" | "phone" | "location" | "company" | "photo">
    >,
  ) => Promise<string | null>;
  fetchTruck: (id: string) => Promise<Truck>;
  addTruck: (input: NewTruckInput) => Promise<string | null>;
  updateTruck: (
    id: string,
    patch: Partial<Omit<Truck, "id" | "ownerId" | "owner" | "status">>,
  ) => Promise<string | null>;
  deleteTruck: (id: string) => Promise<string | null>;
  setAvailability: (id: string, status: TruckStatus) => Promise<string | null>;
  createBooking: (
    truck: Truck,
    input: NewBookingInput,
  ) => Promise<string | null>;
  setBookingStatus: (
    id: string,
    status: BookingStatus,
  ) => Promise<string | null>;
  reportProblem: (bookingId: string, reason: string) => Promise<string | null>;
  resolveDispute: (disputeId: string, notes: string) => Promise<string | null>;
  /**
   * Administrator decision on a disputed booking: `refundRwf` of the held payment goes back to the
   * importer's wallet and the rest is released to the owner. Closes the booking.
   */
  settleDispute: (
    bookingId: string,
    input: { refundRwf: number; resolutionNotes: string },
  ) => Promise<string | null>;
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
  payBooking: (
    bookingId: string,
    checkout?: CheckoutDetails,
  ) => Promise<string | null>;
  /**
   * Demonstration only: adds a booking record (used when a quotation is accepted) and marks its truck
   * unavailable. A real backend creates the booking inside the "accept quotation" transaction.
   */
  addBooking: (booking: Booking) => Promise<string | null>;
  /** Demonstration only: merge changes into a booking (payment state, status). Backend-authoritative later. */
  patchBooking: (id: string, patch: Partial<Booking>) => Promise<string | null>;
  addReview: (
    truckId: string,
    input: { rating: number; comment: string },
  ) => Promise<string | null>;
  requestRefund: (
    bookingId: string,
    input: {
      reason: string;
      details: string;
      amountRwf: number;
      refundTo: string;
    },
  ) => Promise<string | null>;
  /** Administrator decision. Approving refunds `amountRwf` (default: the amount asked) from escrow. */
  processRefund: (
    refundId: string,
    decision: "APPROVED" | "REJECTED",
    note: string,
    amountRwf?: number,
  ) => Promise<string | null>;
  /** The truck owner gives their side of a refund request. */
  respondToRefund: (refundId: string, response: string) => Promise<string | null>;
};

const StoreContext = createContext<Store | null>(null);

function mapUser(
  user: ApiRelatedUser,
  role: Role = user.role ?? "IMPORTER",
): User {
  return {
    ...user,
    phone: user.phone ?? "",
    location: user.location ?? "",
    company: user.company ?? undefined,
    // The admin user list points photos at the API (`/users/:id/photo`) instead of embedding them.
    photo: user.photo?.startsWith("/users/") ? apiUrl(user.photo) : (user.photo ?? undefined),
    role,
    active: user.active ?? true,
  };
}

function mapTruck(truck: ApiTruck): Truck {
  return {
    ...truck,
    currentLocation: truck.currentLocation ?? "",
    preferredRoute: truck.preferredRoute ?? "",
    description: truck.description ?? "",
    // Lists point photos at the API (`/trucks/:id/photos/0`) instead of embedding them.
    photos: (truck.photos ?? []).map((photo) =>
      photo.startsWith("/trucks/") ? apiUrl(photo) : photo,
    ),
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

function mapBooking(booking: ApiBooking): Booking {
  const apiPayment = booking.payment as
    | (BookingPayment & {
        fundedAt?: string | null;
        createdAt?: string;
      })
    | null;
  const payment: BookingPayment | null = apiPayment
    ? {
        ...apiPayment,
        method: apiPayment.method ?? "MTN",
        paidAt:
          apiPayment.paidAt ??
          apiPayment.fundedAt ??
          apiPayment.createdAt ??
          booking.createdAt,
        receiptNumber:
          apiPayment.receiptNumber ??
          `IB-${booking.id.replace(/[^a-z0-9]/gi, "").slice(-10).toUpperCase()}`,
        payerName: apiPayment.payerName ?? booking.importer?.name ?? "Importer",
        accountMask: apiPayment.accountMask ?? "Simulated payment",
        heldAt: apiPayment.heldAt ?? apiPayment.fundedAt ?? null,
      }
    : null;
  return {
    ...booking,
    cargoWeight: String(booking.cargoWeight),
    cargoDescription: booking.cargoDescription ?? "",
    additionalInstructions: booking.additionalInstructions ?? "",
    agreedPrice: booking.agreedPrice ?? "",
    payment,
    dispute: booking.dispute ? mapDispute(booking.dispute) : null,
  };
}

function mapDispute(dispute: ApiDispute): Dispute {
  return {
    ...dispute,
    resolutionNotes: dispute.resolutionNotes ?? "",
  };
}

function mapReview(review: Review): Review {
  return {
    ...review,
    authorPhoto: review.authorPhoto?.startsWith("/users/")
      ? apiUrl(review.authorPhoto)
      : review.authorPhoto,
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
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [trucksLoading, setTrucksLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [walletAccounts, setWalletAccounts] = useState<WalletAccount[]>([]);
  const [adminCommission, setAdminCommission] =
    useState<AdminCommission | null>(null);
  const demoSession = useRef<DemoSession | null>(null);

  const publishDemo = useCallback(
    (session: DemoSession, userId: string | null) => {
      demoSession.current = session;
      saveDemoSession(session, userId);
      const user = userId
        ? (session.users.find((item) => item.id === userId) ?? null)
        : null;
      setCurrentUser(user);
      setUsers(session.users);
      setBookings(session.bookings);
      setDisputes(session.disputes);
      setRefunds(session.refunds ?? []);
      setReviews(session.reviews ?? []);
      setTrucks(session.trucks);
      setWalletBalance(user ? walletBalanceFor(session, user.id) : 0);
      setTransactions(
        user
          ? session.transactions.filter(
              (transaction) => transaction.userId === user.id,
            )
          : [],
      );
      setWalletAccounts(
        user?.role === "ADMIN" ? walletAccountsFor(session) : [],
      );
      setAdminCommission(
        user?.role === "ADMIN" ? commissionFor(session.bookings) : null,
      );
      setConnectionError(null);
      setTrucksLoading(false);
    },
    [],
  );

  const loadPublicTrucks = useCallback(async () => {
    setTrucksLoading(true);
    try {
      const [records, reviewRecords] = await Promise.all([
        api<ApiTruck[]>("/trucks"),
        api<Review[]>("/reviews").catch(() => [] as Review[]),
      ]);
      setTrucks(records.map(mapTruck));
      setReviews(reviewRecords.map(mapReview));
      setConnectionError(null);
    } catch (error) {
      const message = errorMessage(error, "Could not load available trucks.");
      setConnectionError(message);
      console.error("Could not load available trucks.", error);
    } finally {
      setTrucksLoading(false);
    }
  }, []);

  const loadMarketplace = useCallback(
    /**
     * `withOperations` also reloads the operations dataset (about twenty more requests). Only
     * sign-in and an explicit refresh need it: operations services refresh the domains they
     * change, and marketplace actions do not touch operations records.
     */
    async (user: User, { withOperations = true }: { withOperations?: boolean } = {}) => {
      setTrucksLoading(true);
      try {
        const truckPath =
          user.role === "TRUCK_OWNER" ? "/trucks?mine=true" : "/trucks";
        const adminUsersRequest =
          user.role === "ADMIN"
            ? api<ApiUser[]>("/users")
            : Promise.resolve([] as ApiUser[]);
        const operationsRequest = withOperations
          ? loadOperationsSnapshot({
              id: user.id,
              name: user.name,
              role: user.role,
              adminUserIds: adminUsersRequest
                .then((records) =>
                  records
                    .filter((record) => record.role === "ADMIN")
                    .map((record) => record.id),
                )
                .catch(() => [user.id]),
            })
          : null;
        // Handled below; this keeps a failure from surfacing as an unhandled rejection meanwhile.
        operationsRequest?.catch(() => undefined);
        const [
          truckRecords,
          bookingRecords,
          disputeRecords,
          wallet,
          adminUsers,
          adminWalletAccounts,
          commissionSummary,
          refundRecords,
          reviewRecords,
        ] = await Promise.all([
          api<ApiTruck[]>(truckPath),
          api<ApiBooking[]>("/bookings"),
          api<ApiDispute[]>("/disputes"),
          api<ApiWallet>("/wallet"),
          adminUsersRequest,
          user.role === "ADMIN"
            ? api<ApiAdminWalletAccount[]>("/wallet/admin/accounts")
            : Promise.resolve([]),
          user.role === "ADMIN"
            ? api<AdminCommission>("/wallet/admin/commission")
            : Promise.resolve(null),
          api<RefundRequest[]>("/refunds").catch(() => [] as RefundRequest[]),
          api<Review[]>("/reviews").catch(() => [] as Review[]),
        ]);

        const mappedBookings = bookingRecords.map(mapBooking);
        const mappedTrucks = truckRecords.map(mapTruck);
        const nestedTrucks = bookingRecords.map((booking) =>
          mapTruck(booking.truck),
        );
        // Later entries win: the truck list is the complete record, booking copies only fill gaps.
        const allTrucks = uniqueById([...nestedTrucks, ...mappedTrucks]);
        const mappedDisputes = disputeRecords.map(mapDispute);
        const mappedUsers = adminUsers.map((user) => mapUser(user));
        const relatedUsers = [
          ...bookingRecords.flatMap((booking) => [
            mapUser(booking.importer, "IMPORTER"),
            ...(booking.truck.owner
              ? [mapUser(booking.truck.owner, "TRUCK_OWNER")]
              : []),
          ]),
          ...mappedTrucks.flatMap((truck) =>
            truck.owner ? [mapUser(truck.owner, "TRUCK_OWNER")] : [],
          ),
        ];
        const allUsers = uniqueById([...mappedUsers, ...relatedUsers, user]);

        setCurrentUser(user);
        setUsers(allUsers);
        setBookings(mappedBookings);
        setDisputes(mappedDisputes);
        setRefunds(refundRecords);
        setReviews(reviewRecords.map(mapReview));
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
        if (operationsRequest) {
          try {
            mockDb.replaceFromApi(await operationsRequest);
          } catch (error) {
            const message = errorMessage(
              error,
              "Could not load operations data.",
            );
            setConnectionError(message);
            console.error("Could not load operations data.", error);
          }
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearAuthToken();
          setCurrentUser(null);
          setUsers([]);
          setBookings([]);
          setDisputes([]);
          setRefunds([]);
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
    },
    [loadPublicTrucks],
  );

  const refreshAfterMutation = useCallback(async () => {
    if (currentUser) {
      await loadMarketplace(currentUser, { withOperations: false });
    } else {
      await loadPublicTrucks();
    }
  }, [currentUser, loadMarketplace, loadPublicTrucks]);

  const refreshMarketplace = useCallback(async () => {
    if (currentUser) await loadMarketplace(currentUser);
  }, [currentUser, loadMarketplace]);

  useEffect(() => {
    let active = true;

    async function initialize() {
      if (demoEnabled) {
        const loaded = loadDemoSession();
        if (active) {
          publishDemo(loaded.session, loaded.userId);
          setReady(true);
        }
        return;
      }
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
        const message = errorMessage(
          error,
          "Could not connect to the iBanga API.",
        );
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
  }, [loadMarketplace, loadPublicTrucks, publishDemo]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (demoEnabled && demoSession.current) {
        const result = demoAuthenticate(demoSession.current, email, password);
        if (!result.user) return { user: null, error: result.error };
        publishDemo(demoSession.current, result.user.id);
        return { user: result.user, error: null };
      }
      try {
        const result = await api<{ token: string; user: ApiUser }>(
          "/auth/login",
          {
            method: "POST",
            body: JSON.stringify({ email, password }),
          },
        );
        saveAuthToken(result.token);
        const user = mapUser(result.user);
        setCurrentUser(user);
        await loadMarketplace(user);
        return { user, error: null };
      } catch (error) {
        return { user: null, error: errorMessage(error, "Could not sign in.") };
      }
    },
    [loadMarketplace, publishDemo],
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    if (demoEnabled) {
      const known = demoSession.current?.users.some(
        (user) => user.email.toLowerCase() === email.trim().toLowerCase(),
      );
      return known
        ? { message: "Demo mode: use the password shown on the sign-in page." }
        : { message: "", error: "No demo account uses that email." };
    }
    try {
      return await api<{ message: string }>("/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      return {
        message: "",
        error: errorMessage(error, "Could not request a password reset."),
      };
    }
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    if (demoEnabled)
      return "Password reset stays on the sign-in page while demo data is in use.";
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

  const register = useCallback<Store["register"]>(
    async (input) => {
      if (demoEnabled && demoSession.current) {
        const result = demoRegister(demoSession.current, input);
        if ("error" in result) return result.error;
        publishDemo(result.session, result.user.id);
        return null;
      }
      try {
        const result = await api<{ token: string; user: ApiUser }>(
          "/auth/register",
          {
            method: "POST",
            body: JSON.stringify({
              name: input.name,
              email: input.email,
              phone: input.phone,
              location: input.location,
              password: input.password,
              role: input.role,
            }),
          },
        );
        saveAuthToken(result.token);
        let user = mapUser(result.user);
        setCurrentUser(user);
        if (input.company.trim()) {
          try {
            user = mapUser(
              await api<ApiUser>("/auth/me", {
                method: "PATCH",
                body: JSON.stringify({ company: input.company }),
              }),
            );
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
    },
    [loadMarketplace, publishDemo],
  );

  const logout = useCallback(() => {
    if (demoEnabled && demoSession.current) {
      publishDemo(demoSession.current, null);
      return;
    }
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
  }, [loadPublicTrucks, publishDemo]);

  const addUser = useCallback<Store["addUser"]>(
    async (input) => {
      if (demoEnabled && demoSession.current && currentUser) {
        const result = demoAddUser(demoSession.current, input);
        if ("error" in result) return result.error;
        publishDemo(result.session, currentUser.id);
        return null;
      }
      try {
        await api("/users", {
          method: "POST",
          body: JSON.stringify(input),
        });
        await refreshAfterMutation();
        return null;
      } catch (error) {
        return errorMessage(error, "Could not create the account.");
      }
    },
    [currentUser, publishDemo, refreshAfterMutation],
  );

  const updateProfile = useCallback<Store["updateProfile"]>(
    async (patch) => {
      if (!currentUser) return "Sign in to update your profile.";
      if (demoEnabled && demoSession.current) {
        const users = demoSession.current.users.map((user) =>
          user.id === currentUser.id ? { ...user, ...patch } : user,
        );
        publishDemo({ ...demoSession.current, users }, currentUser.id);
        return null;
      }
      try {
        const user = mapUser(
          await api<ApiUser>("/auth/me", {
            method: "PATCH",
            body: JSON.stringify(patch),
          }),
        );
        await loadMarketplace(user, { withOperations: false });
        return null;
      } catch (error) {
        return errorMessage(error, "Could not update your profile.");
      }
    },
    [currentUser, loadMarketplace, publishDemo],
  );

  const fetchTruck = useCallback<Store["fetchTruck"]>(async (id) => {
    if (demoEnabled) {
      const truck = demoSession.current?.trucks.find((item) => item.id === id);
      if (!truck) throw new Error("Truck not found in the demo data.");
      return truck;
    }
    const truck = await api<ApiTruck>(`/trucks/${encodeURIComponent(id)}`);
    return mapTruck(truck);
  }, []);

  const addTruck = useCallback<Store["addTruck"]>(
    async (input) => {
      if (!currentUser) return "Sign in to list a truck.";
      if (demoEnabled && demoSession.current) {
        publishDemo(
          demoAddTruck(demoSession.current, currentUser, input),
          currentUser.id,
        );
        return null;
      }
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
    },
    [currentUser, publishDemo, refreshAfterMutation],
  );

  const updateTruck = useCallback<Store["updateTruck"]>(
    async (id, patch) => {
      if (demoEnabled && demoSession.current && currentUser) {
        publishDemo(
          demoUpdateTruck(demoSession.current, id, patch),
          currentUser.id,
        );
        return null;
      }
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
    },
    [currentUser, publishDemo, refreshAfterMutation],
  );

  const deleteTruck = useCallback<Store["deleteTruck"]>(
    async (id) => {
      if (demoEnabled && demoSession.current && currentUser) {
        publishDemo(
          {
            ...demoSession.current,
            trucks: demoSession.current.trucks.filter(
              (truck) => truck.id !== id,
            ),
          },
          currentUser.id,
        );
        return null;
      }
      try {
        await api(`/trucks/${encodeURIComponent(id)}`, { method: "DELETE" });
        await refreshAfterMutation();
        return null;
      } catch (error) {
        return errorMessage(error, "Could not remove the truck.");
      }
    },
    [currentUser, publishDemo, refreshAfterMutation],
  );

  const setAvailability = useCallback<Store["setAvailability"]>(
    async (id, status) => {
      if (demoEnabled && demoSession.current && currentUser) {
        publishDemo(
          demoSetAvailability(demoSession.current, id, status),
          currentUser.id,
        );
        return null;
      }
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
    },
    [currentUser, publishDemo, refreshAfterMutation],
  );

  const createBooking = useCallback<Store["createBooking"]>(
    async (truck, input) => {
      if (!currentUser) return "Sign in to book a truck.";
      if (demoEnabled && demoSession.current) {
        const result = demoCreateBooking(
          demoSession.current,
          currentUser,
          truck,
          input,
        );
        if ("error" in result) return result.error;
        const createdBooking = result.session.bookings.find(
          (item) => !demoSession.current?.bookings.some((previous) => previous.id === item.id),
        );
        if (!createdBooking) return "Could not create the booking.";
        const ownerId = truck.ownerId;
        mockDb.update((data) => {
          const notificationId = `booking-${createdBooking.id}-${ownerId}-${Date.now()}`;
          return {
            ...data,
            notifications: [{
              id: notificationId,
              userId: ownerId,
              category: "BOOKING",
              title: "New truck booking",
              body: `A customer booked your truck for cargo from ${input.pickupLocation} to ${input.destination}.`,
              href: `/dashboard/owner/bookings/${createdBooking.id}`,
              read: false,
              createdAt: new Date().toISOString(),
            }, ...data.notifications],
          };
        });
        publishDemo(result.session, currentUser.id);
        return null;
      }
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
    },
    [currentUser, publishDemo, refreshAfterMutation],
  );

  const setBookingStatus = useCallback<Store["setBookingStatus"]>(
    async (id, status) => {
      if (demoEnabled && demoSession.current && currentUser) {
        const session = demoSession.current;
        const booking = session.bookings.find((item) => item.id === id);
        const result = demoSetBookingStatus(session, id, status);
        if (booking && booking.status !== status) {
          const owner = session.trucks.find((item) => item.id === booking.truckId)?.ownerId;
          const notice = {
            ACCEPTED: { userId: booking.importerId, title: "Owner accepted your booking", body: `The truck owner accepted booking ${id}. You can now arrange payment.` },
            REJECTED: { userId: booking.importerId, title: "Booking declined", body: `The truck owner declined booking ${id}.` },
            IN_PROGRESS: { userId: booking.importerId, title: "Trip started", body: `Booking ${id} has left pickup and is now in transit.` },
            DELIVERED: { userId: booking.importerId, title: "Cargo delivered", body: `Booking ${id} is marked delivered. Confirm receipt or report a problem.` },
            COMPLETED: { userId: owner, title: "Receipt confirmed", body: `The importer confirmed receipt. Booking ${id} is complete.` },
            DISPUTED: { userId: owner, title: "Booking disputed", body: `The importer reported a problem with booking ${id}.` },
            PENDING: { userId: undefined, title: "Booking updated", body: `Booking ${id} was updated.` },
          }[status];
          const recipient = notice.userId;
          if (recipient && recipient !== currentUser.id) {
          mockDb.update((data) => ({
            ...data,
            notifications: [
              {
                id: `booking-${id}-${recipient}-${Date.now()}`,
                userId: recipient,
                category: "BOOKING" as const,
                title: notice.title,
                body: notice.body,
                href: `/dashboard/${recipient === booking.importerId ? "importer" : "owner"}/bookings/${id}`,
                read: false,
                createdAt: new Date().toISOString(),
              },
              ...data.notifications,
            ],
          }));
          }
        }
        publishDemo(result, currentUser.id);
        return null;
      }
      try {
        const updated = await api<ApiBooking>(
          `/bookings/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            body: JSON.stringify({ status }),
          },
        );
        const mappedBooking = mapBooking(updated);
        setBookings((previous) =>
          previous.map((booking) =>
            booking.id === mappedBooking.id ? mappedBooking : booking,
          ),
        );
        if (status === "REJECTED" || status === "COMPLETED") {
          setTrucks((previous) =>
            previous.map((truck) =>
              truck.id === mappedBooking.truckId
                ? { ...truck, status: "AVAILABLE" }
                : truck,
            ),
          );
        }
        return null;
      } catch (error) {
        return errorMessage(error, "Could not update the booking.");
      }
    },
    [currentUser, publishDemo],
  );

  const reportProblem = useCallback<Store["reportProblem"]>(
    async (bookingId, reason) => {
      if (demoEnabled && demoSession.current && currentUser) {
        publishDemo(
          demoReportProblem(
            demoSession.current,
            currentUser,
            bookingId,
            reason,
          ),
          currentUser.id,
        );
        return null;
      }
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
    },
    [currentUser, publishDemo, refreshAfterMutation],
  );

  const resolveDispute = useCallback<Store["resolveDispute"]>(
    async (disputeId, notes) => {
      if (demoEnabled && demoSession.current && currentUser) {
        publishDemo(
          demoResolveDispute(demoSession.current, disputeId, notes),
          currentUser.id,
        );
        return null;
      }
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
    },
    [currentUser, publishDemo, refreshAfterMutation],
  );

  const settleDispute = useCallback<Store["settleDispute"]>(
    async (bookingId, input) => {
      if (demoEnabled) {
        return "Settling a dispute moves real money, so it needs the API. Switch off demo mode.";
      }
      try {
        await api(`/bookings/${encodeURIComponent(bookingId)}/settle-dispute`, {
          method: "POST",
          body: JSON.stringify(input),
        });
        await refreshAfterMutation();
        return null;
      } catch (error) {
        return errorMessage(error, "Could not settle the dispute.");
      }
    },
    [refreshAfterMutation],
  );

  const setUserActive = useCallback<Store["setUserActive"]>(
    async (userId, active) => {
      if (demoEnabled && demoSession.current && currentUser) {
        publishDemo(
          {
            ...demoSession.current,
            users: demoSession.current.users.map((user) =>
              user.id === userId ? { ...user, active } : user,
            ),
          },
          currentUser.id,
        );
        return null;
      }
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
    },
    [currentUser, publishDemo, refreshAfterMutation],
  );

  const deleteUser = useCallback<Store["deleteUser"]>(
    async (userId) => {
      if (demoEnabled && demoSession.current && currentUser) {
        const email = demoSession.current.users
          .find((user) => user.id === userId)
          ?.email.toLowerCase();
        const credentials = { ...demoSession.current.credentials };
        if (email) delete credentials[email];
        publishDemo(
          {
            ...demoSession.current,
            users: demoSession.current.users.filter(
              (user) => user.id !== userId,
            ),
            credentials,
          },
          currentUser.id,
        );
        return null;
      }
      try {
        await api(`/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
        await refreshAfterMutation();
        return null;
      } catch (error) {
        return errorMessage(error, "Could not remove the account.");
      }
    },
    [currentUser, publishDemo, refreshAfterMutation],
  );

  const depositFunds = useCallback<Store["depositFunds"]>(
    async (amount, phoneNumber) => {
      if (demoEnabled && demoSession.current && currentUser) {
        const result = demoDeposit(demoSession.current, currentUser, amount);
        if ("error" in result) return result.error;
        publishDemo(result.session, currentUser.id);
        return null;
      }
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
    },
    [currentUser, publishDemo, refreshAfterMutation],
  );

  const withdrawFunds = useCallback<Store["withdrawFunds"]>(
    async (input) => {
      if (demoEnabled && demoSession.current && currentUser) {
        const result = demoWithdraw(
          demoSession.current,
          currentUser,
          input.amountRwf,
        );
        if ("error" in result) return result.error;
        publishDemo(result.session, currentUser.id);
        return null;
      }
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
    },
    [currentUser, publishDemo, refreshAfterMutation],
  );

  const payBooking = useCallback<Store["payBooking"]>(
    async (bookingId, checkout) => {
      if (demoEnabled && demoSession.current && currentUser) {
        const booking = demoSession.current.bookings.find((item) => item.id === bookingId);
        const ownerId = booking
          ? demoSession.current.trucks.find((item) => item.id === booking.truckId)?.ownerId
          : undefined;
        const result = demoPayBooking(
          demoSession.current,
          currentUser,
          bookingId,
          checkout,
        );
        if ("error" in result) return result.error;
        if (ownerId) {
          mockDb.update((data) => ({
            ...data,
            notifications: [{
              id: `payment-${bookingId}-${ownerId}-${Date.now()}`,
              userId: ownerId,
              category: "PAYMENT",
              title: "Importer paid for your booking",
              body: `Payment for booking ${bookingId} is recorded and held until delivery is confirmed.`,
              href: `/dashboard/owner/payments/${bookingId}`,
              read: false,
              createdAt: new Date().toISOString(),
            }, ...data.notifications],
          }));
        }
        publishDemo(result.session, currentUser.id);
        return null;
      }
      try {
        await api(`/wallet/bookings/${encodeURIComponent(bookingId)}/pay`, {
          method: "POST",
          body: checkout ? JSON.stringify(checkout) : undefined,
        });
        await refreshAfterMutation();
        return null;
      } catch (error) {
        return errorMessage(error, "Could not pay for the booking.");
      }
    },
    [currentUser, publishDemo, refreshAfterMutation],
  );

  const addBooking = useCallback<Store["addBooking"]>(
    async (booking) => {
      if (!(demoEnabled && demoSession.current && currentUser))
        return "Creating bookings from quotations is only available in demonstration mode.";
      const session = demoSession.current;
      if (session.bookings.some((item) => item.id === booking.id))
        return "That booking already exists.";
      publishDemo(
        {
          ...session,
          bookings: [booking, ...session.bookings],
          trucks: session.trucks.map((truck) =>
            truck.id === booking.truckId
              ? { ...truck, status: "UNAVAILABLE" }
              : truck,
          ),
        },
        currentUser.id,
      );
      return null;
    },
    [currentUser, publishDemo],
  );

  const patchBooking = useCallback<Store["patchBooking"]>(
    async (id, patch) => {
      if (!(demoEnabled && demoSession.current && currentUser))
        return "Editing bookings this way is only available in demonstration mode.";
      const session = demoSession.current;
      const booking = session.bookings.find((item) => item.id === id);
      if (!booking) return "Booking not found.";
      publishDemo(
        {
          ...session,
          bookings: session.bookings.map((item) =>
            item.id === id ? { ...item, ...patch } : item,
          ),
          trucks:
            patch.status === "REJECTED" || patch.status === "COMPLETED"
              ? session.trucks.map((truck) =>
                  truck.id === booking.truckId
                    ? { ...truck, status: "AVAILABLE" }
                    : truck,
                )
              : session.trucks,
        },
        currentUser.id,
      );
      return null;
    },
    [currentUser, publishDemo],
  );

  const addReview = useCallback<Store["addReview"]>(
    async (truckId, input) => {
      if (demoEnabled && demoSession.current && currentUser) {
        const result = demoAddReview(
          demoSession.current,
          currentUser,
          truckId,
          input,
        );
        if ("error" in result) return result.error;
        publishDemo(result.session, currentUser.id);
        return null;
      }
      try {
        await api(`/trucks/${encodeURIComponent(truckId)}/reviews`, {
          method: "POST",
          body: JSON.stringify(input),
        });
        await refreshAfterMutation();
        return null;
      } catch (error) {
        return errorMessage(error, "Could not post your review.");
      }
    },
    [currentUser, publishDemo, refreshAfterMutation],
  );

  const requestRefund = useCallback<Store["requestRefund"]>(
    async (bookingId, input) => {
      if (demoEnabled && demoSession.current && currentUser) {
        const result = demoRequestRefund(
          demoSession.current,
          currentUser,
          bookingId,
          input,
        );
        if ("error" in result) return result.error;
        publishDemo(result.session, currentUser.id);
        return null;
      }
      try {
        await api("/refunds", {
          method: "POST",
          body: JSON.stringify({ bookingId, ...input }),
        });
        await refreshAfterMutation();
        return null;
      } catch (error) {
        return errorMessage(error, "Could not send the refund request.");
      }
    },
    [currentUser, publishDemo, refreshAfterMutation],
  );

  const processRefund = useCallback<Store["processRefund"]>(
    async (refundId, decision, note, amountRwf) => {
      if (demoEnabled && demoSession.current && currentUser) {
        const result = demoProcessRefund(
          demoSession.current,
          refundId,
          decision,
          note,
        );
        if ("error" in result) return result.error;
        publishDemo(result.session, currentUser.id);
        return null;
      }
      try {
        await api(`/refunds/${encodeURIComponent(refundId)}`, {
          method: "PATCH",
          body: JSON.stringify({ status: decision, note, ...(amountRwf ? { amountRwf } : {}) }),
        });
        await refreshAfterMutation();
        return null;
      } catch (error) {
        return errorMessage(error, "Could not process the refund request.");
      }
    },
    [currentUser, publishDemo, refreshAfterMutation],
  );

  const respondToRefund = useCallback<Store["respondToRefund"]>(
    async (refundId, response) => {
      if (demoEnabled) return "Responding to a refund request needs the API.";
      try {
        await api(`/refunds/${encodeURIComponent(refundId)}/respond`, {
          method: "PATCH",
          body: JSON.stringify({ response }),
        });
        await refreshAfterMutation();
        return null;
      } catch (error) {
        return errorMessage(error, "Could not send your response.");
      }
    },
    [refreshAfterMutation],
  );

  const value = useMemo<Store>(
    () => ({
      ready,
      connectionError,
      refreshMarketplace,
      currentUser,
      users,
      bookings,
      disputes,
      refunds,
      reviews,
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
      addUser,
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
      settleDispute,
      setUserActive,
      deleteUser,
      depositFunds,
      withdrawFunds,
      payBooking,
      addBooking,
      patchBooking,
      addReview,
      requestRefund,
      processRefund,
      respondToRefund,
    }),
    [
      ready,
      connectionError,
      refreshMarketplace,
      currentUser,
      users,
      bookings,
      disputes,
      refunds,
      reviews,
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
      addUser,
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
      settleDispute,
      setUserActive,
      deleteUser,
      depositFunds,
      withdrawFunds,
      payBooking,
      addBooking,
      patchBooking,
      addReview,
      requestRefund,
      processRefund,
      respondToRefund,
    ],
  );

  return (
    <StoreContext.Provider value={value}>
      {connectionError ? (
        <p
          role="alert"
          className="border-b border-bad/20 bg-bad-soft px-4 py-2 text-center text-sm text-bad"
        >
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
  if (role === "DRIVER") return "/dashboard/driver";
  return "/dashboard/importer";
}
