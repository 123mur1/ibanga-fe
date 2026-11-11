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
  api,
  apiUrl,
  ApiError,
  clearAuthToken,
  readAuthToken,
  saveAuthToken,
} from "./api";
import { loadOperationsSnapshot } from "@/services/api/operations-records";
import { mockDb } from "@/services/mock-db";
import type {
  Booking,
  BookingDocumentKind,
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
  currentLocation?: string;
  preferredRoute?: string;
  description?: string;
  photos?: string[];
  category?: string;
  pricePerKmRwf?: number;
  destinations?: string[];
  acceptedCargo?: string[];
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
  /** Pays the 50% deposit after the owner accepts (within the deposit window). */
  payBooking: (
    bookingId: string,
    checkout?: CheckoutDetails,
  ) => Promise<string | null>;
  /** The importer confirms the cargo arrived and pays the remaining 50%; the booking completes. */
  confirmReceipt: (
    bookingId: string,
    checkout?: CheckoutDetails,
  ) => Promise<string | null>;
  /** Cargo or tax document, after the deposit and before the trip starts. */
  uploadBookingDocument: (
    bookingId: string,
    input: { kind: BookingDocumentKind; name: string; dataUrl: string },
  ) => Promise<string | null>;
  removeBookingDocument: (
    bookingId: string,
    documentId: string,
  ) => Promise<string | null>;
  /** Driver or owner: message everyone on the trip (emailed); with delayDays it moves the delivery. */
  sendTripUpdate: (
    bookingId: string,
    input: { message: string; delayDays?: number },
  ) => Promise<{ error: string | null; affected: number }>;
  /** Importer whose booking a delay overlaps: shift the dates or cancel with a full refund. */
  decideDelay: (
    bookingId: string,
    impactId: string,
    decision: "SHIFT" | "REFUND",
  ) => Promise<string | null>;
  /** Anyone can review: signed-in users post as themselves, visitors give a name. */
  addReview: (
    truckId: string,
    input: { rating: number; comment: string; authorName?: string },
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
    destinations: truck.destinations ?? [],
    acceptedCargo: truck.acceptedCargo ?? [],
    bookedRanges: truck.bookedRanges ?? [],
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
          photo: truck.owner.photo?.startsWith("/users/") ? apiUrl(truck.owner.photo) : truck.owner.photo,
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
        // Later entries win. Booking and truck copies of a person carry no photo, status or join
        // date, so they only fill gaps: the admin user list and the signed-in user come last.
        const allUsers = uniqueById([...relatedUsers, ...mappedUsers, user]);

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

  /**
   * Reloads after a change the server has already saved. A failed reload must not turn that
   * success into an error (the importer would think a booking failed and book again), so it is
   * only logged; the data catches up on the next load.
   */
  const refreshAfterMutation = useCallback(async () => {
    try {
      if (currentUser) {
        await loadMarketplace(currentUser, { withOperations: false });
      } else {
        await loadPublicTrucks();
      }
    } catch (error) {
      console.warn("The change was saved, but reloading the data failed.", error);
    }
  }, [currentUser, loadMarketplace, loadPublicTrucks]);

  const refreshMarketplace = useCallback(async () => {
    if (currentUser) await loadMarketplace(currentUser);
  }, [currentUser, loadMarketplace]);

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
  }, [loadMarketplace, loadPublicTrucks]);

  const login = useCallback(
    async (email: string, password: string) => {
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
    [loadMarketplace],
  );

  const requestPasswordReset = useCallback(async (email: string) => {
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
    [loadMarketplace],
  );

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

  const addUser = useCallback<Store["addUser"]>(
    async (input) => {
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
    [refreshAfterMutation],
  );

  const updateProfile = useCallback<Store["updateProfile"]>(
    async (patch) => {
      if (!currentUser) return "Sign in to update your profile.";
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
    [currentUser, loadMarketplace],
  );

  const fetchTruck = useCallback<Store["fetchTruck"]>(async (id) => {
    const truck = await api<ApiTruck>(`/trucks/${encodeURIComponent(id)}`);
    return mapTruck(truck);
  }, []);

  const addTruck = useCallback<Store["addTruck"]>(
    async (input) => {
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
    },
    [currentUser, refreshAfterMutation],
  );

  const updateTruck = useCallback<Store["updateTruck"]>(
    async (id, patch) => {
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
    [refreshAfterMutation],
  );

  const deleteTruck = useCallback<Store["deleteTruck"]>(
    async (id) => {
      try {
        await api(`/trucks/${encodeURIComponent(id)}`, { method: "DELETE" });
        await refreshAfterMutation();
        return null;
      } catch (error) {
        return errorMessage(error, "Could not remove the truck.");
      }
    },
    [refreshAfterMutation],
  );

  const setAvailability = useCallback<Store["setAvailability"]>(
    async (id, status) => {
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
    [refreshAfterMutation],
  );

  const createBooking = useCallback<Store["createBooking"]>(
    async (truck, input) => {
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
            pickupCountry: input.pickupCountry ?? undefined,
            pickupCity: input.pickupCity ?? undefined,
            pickupArea: input.pickupArea ?? undefined,
            destinationCountry: input.destinationCountry ?? undefined,
            destinationCity: input.destinationCity ?? undefined,
            destinationArea: input.destinationArea ?? undefined,
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
    [currentUser, refreshAfterMutation],
  );

  const setBookingStatus = useCallback<Store["setBookingStatus"]>(
    async (id, status) => {
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
        if (status === "REJECTED" || status === "CANCELLED" || status === "COMPLETED") {
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
    [],
  );

  const reportProblem = useCallback<Store["reportProblem"]>(
    async (bookingId, reason) => {
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
    [refreshAfterMutation],
  );

  const resolveDispute = useCallback<Store["resolveDispute"]>(
    async (disputeId, notes) => {
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
    [refreshAfterMutation],
  );

  const settleDispute = useCallback<Store["settleDispute"]>(
    async (bookingId, input) => {
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
    [refreshAfterMutation],
  );

  const deleteUser = useCallback<Store["deleteUser"]>(
    async (userId) => {
      try {
        await api(`/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
        await refreshAfterMutation();
        return null;
      } catch (error) {
        return errorMessage(error, "Could not remove the account.");
      }
    },
    [refreshAfterMutation],
  );

  const depositFunds = useCallback<Store["depositFunds"]>(
    async (amount, phoneNumber) => {
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
    [refreshAfterMutation],
  );

  const withdrawFunds = useCallback<Store["withdrawFunds"]>(
    async (input) => {
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
    [refreshAfterMutation],
  );

  const payBooking = useCallback<Store["payBooking"]>(
    async (bookingId, checkout) => {
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
    [refreshAfterMutation],
  );



  const confirmReceipt = useCallback<Store["confirmReceipt"]>(
    async (bookingId, checkout) => {
      try {
        await api(`/bookings/${encodeURIComponent(bookingId)}/confirm-receipt`, {
          method: "POST",
          body: JSON.stringify(checkout ?? {}),
        });
        await refreshAfterMutation();
        return null;
      } catch (error) {
        return errorMessage(error, "Could not confirm receipt.");
      }
    },
    [refreshAfterMutation],
  );

  const uploadBookingDocument = useCallback<Store["uploadBookingDocument"]>(
    async (bookingId, input) => {
      try {
        await api(`/bookings/${encodeURIComponent(bookingId)}/documents`, {
          method: "POST",
          body: JSON.stringify(input),
        });
        await refreshAfterMutation();
        return null;
      } catch (error) {
        return errorMessage(error, "Could not upload the document.");
      }
    },
    [refreshAfterMutation],
  );

  const removeBookingDocument = useCallback<Store["removeBookingDocument"]>(
    async (bookingId, documentId) => {
      try {
        await api(
          `/bookings/${encodeURIComponent(bookingId)}/documents/${encodeURIComponent(documentId)}`,
          { method: "DELETE" },
        );
        await refreshAfterMutation();
        return null;
      } catch (error) {
        return errorMessage(error, "Could not remove the document.");
      }
    },
    [refreshAfterMutation],
  );

  const sendTripUpdate = useCallback<Store["sendTripUpdate"]>(
    async (bookingId, input) => {
      try {
        const result = await api<{ impacts: unknown[] }>(
          `/bookings/${encodeURIComponent(bookingId)}/trip-updates`,
          { method: "POST", body: JSON.stringify(input) },
        );
        await refreshAfterMutation();
        return { error: null, affected: result.impacts.length };
      } catch (error) {
        return { error: errorMessage(error, "Could not send the trip update."), affected: 0 };
      }
    },
    [refreshAfterMutation],
  );

  const decideDelay = useCallback<Store["decideDelay"]>(
    async (bookingId, impactId, decision) => {
      try {
        await api(
          `/bookings/${encodeURIComponent(bookingId)}/delay-impacts/${encodeURIComponent(impactId)}`,
          { method: "POST", body: JSON.stringify({ decision }) },
        );
        await refreshAfterMutation();
        return null;
      } catch (error) {
        return errorMessage(error, "Could not save your choice.");
      }
    },
    [refreshAfterMutation],
  );

  const addReview = useCallback<Store["addReview"]>(    async (truckId, input) => {
      try {
        // Visitors post through the public endpoint with the name they give.
        await api(
          `/trucks/${encodeURIComponent(truckId)}/reviews${currentUser ? "" : "/guest"}`,
          {
            method: "POST",
            body: JSON.stringify(
              currentUser
                ? { rating: input.rating, comment: input.comment }
                : input,
            ),
          },
        );
        if (currentUser) await refreshAfterMutation();
        else await loadPublicTrucks();
        return null;
      } catch (error) {
        return errorMessage(error, "Could not post your review.");
      }
    },
    [currentUser, refreshAfterMutation, loadPublicTrucks],
  );

  const requestRefund = useCallback<Store["requestRefund"]>(
    async (bookingId, input) => {
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
    [refreshAfterMutation],
  );

  const processRefund = useCallback<Store["processRefund"]>(
    async (refundId, decision, note, amountRwf) => {
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
    [refreshAfterMutation],
  );

  const respondToRefund = useCallback<Store["respondToRefund"]>(
    async (refundId, response) => {
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
      confirmReceipt,
      uploadBookingDocument,
      removeBookingDocument,
      sendTripUpdate,
      decideDelay,
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
      confirmReceipt,
      uploadBookingDocument,
      removeBookingDocument,
      sendTripUpdate,
      decideDelay,
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
