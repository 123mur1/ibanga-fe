"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, getToken, setToken } from "./api";
import { seedBookings, seedDisputes, seedUsers } from "./mock-data";
import {
  ACTIVE_BOOKING_STATUSES,
  type Booking,
  type BookingStatus,
  type Dispute,
  type Role,
  type Truck,
  type TruckStatus,
  type User,
} from "./types";

const STORAGE_KEY = "ibanga-mvp-v3";

type State = {
  users: User[];
  bookings: Booking[];
  disputes: Dispute[];
  currentUserId: string | null;
};

type NewBookingInput = Omit<Booking, "id" | "status" | "createdAt">;

export type TruckSearchParams = {
  mine?: boolean;
  location?: string;
  truckType?: string;
  route?: string;
  minCapacity?: number;
};

export type NewTruckInput = {
  plateNumber: string;
  truckType: string;
  capacity: number;
  currentLocation?: string;
  preferredRoute?: string;
  description?: string;
  photos?: string[];
};

function buildTruckQuery(params?: TruckSearchParams) {
  if (!params) return "";
  const search = new URLSearchParams();
  if (params.mine) search.set("mine", "true");
  if (params.location) search.set("location", params.location);
  if (params.truckType) search.set("truckType", params.truckType);
  if (params.route) search.set("route", params.route);
  if (params.minCapacity) search.set("minCapacity", String(params.minCapacity));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

type AuthPayload = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: Role;
    location: string | null;
  };
};

function toUser(u: AuthPayload["user"]): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone ?? "",
    role: u.role,
    location: u.location ?? "",
    active: true,
  };
}

type Store = State & {
  ready: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<string | null>;
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
  updateProfile: (patch: Partial<Pick<User, "name" | "phone" | "location" | "company" | "photo">>) => void;
  trucks: Truck[];
  trucksLoading: boolean;
  refreshTrucks: (params?: TruckSearchParams) => Promise<string | null>;
  fetchTruck: (id: string) => Promise<Truck>;
  addTruck: (input: NewTruckInput) => Promise<string | null>;
  updateTruck: (
    id: string,
    patch: Partial<Omit<Truck, "id" | "ownerId" | "owner" | "status">>,
  ) => Promise<string | null>;
  deleteTruck: (id: string) => Promise<string | null>;
  setAvailability: (id: string, status: TruckStatus) => Promise<string | null>;
  createBooking: (truck: Truck, input: NewBookingInput) => string | null;
  setAgreedPrice: (id: string, price: string) => string | null;
  setBookingStatus: (id: string, status: BookingStatus) => string | null;
  reportProblem: (bookingId: string, reason: string) => string | null;
  resolveDispute: (disputeId: string, notes: string) => string | null;
  setUserActive: (userId: string, active: boolean) => void;
  resetDemo: () => Promise<string | null>;
};

const StoreContext = createContext<Store | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function seed(): State {
  return {
    users: seedUsers,
    bookings: seedBookings,
    disputes: seedDisputes,
    currentUserId: null,
  };
}

function hasActiveTrip(bookings: Booking[], truckId: string, exceptId?: string) {
  return bookings.some(
    (b) =>
      b.truckId === truckId &&
      b.id !== exceptId &&
      ACTIVE_BOOKING_STATUSES.includes(b.status),
  );
}

export function IbangaProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(seed);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [trucksLoading, setTrucksLoading] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw) as State);
    } catch {
      /* keep seed */
    }

    const token = getToken();
    if (!token) {
      setReady(true);
      return;
    }

    api<AuthPayload["user"]>("/auth/me")
      .then((user) => setAuthUser(toUser(user)))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const currentUser = authUser;

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await api<AuthPayload>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      setAuthUser(toUser(data.user));
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Login failed.";
    }
  }, []);

  const register = useCallback<Store["register"]>(async (input) => {
    try {
      const data = await api<AuthPayload>("/auth/register", {
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
      setToken(data.token);
      setAuthUser(toUser(data.user));
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Registration failed.";
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAuthUser(null);
  }, []);

  const updateProfile = useCallback<Store["updateProfile"]>((patch) => {
    setAuthUser((u) => (u ? { ...u, ...patch } : u));
    setState((s) => ({
      ...s,
      users: s.users.map((user) =>
        user.id === (authUser?.id ?? s.currentUserId) ? { ...user, ...patch } : user,
      ),
    }));
  }, [authUser?.id]);

  const refreshTrucks = useCallback<Store["refreshTrucks"]>(async (params) => {
    setTrucksLoading(true);
    try {
      const data = await api<Truck[]>(`/trucks${buildTruckQuery(params)}`);
      setTrucks(data);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Could not load trucks.";
    } finally {
      setTrucksLoading(false);
    }
  }, []);

  const fetchTruck = useCallback<Store["fetchTruck"]>(
    (id) => api<Truck>(`/trucks/${id}`),
    [],
  );

  const addTruck = useCallback<Store["addTruck"]>(async (input) => {
    try {
      const truck = await api<Truck>("/trucks", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setTrucks((prev) => [truck, ...prev]);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Could not add truck.";
    }
  }, []);

  const updateTruck = useCallback<Store["updateTruck"]>(async (id, patch) => {
    try {
      const truck = await api<Truck>(`/trucks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setTrucks((prev) => prev.map((t) => (t.id === id ? truck : t)));
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Could not update truck.";
    }
  }, []);

  const deleteTruck = useCallback<Store["deleteTruck"]>(async (id) => {
    try {
      await api(`/trucks/${id}`, { method: "DELETE" });
      setTrucks((prev) => prev.filter((t) => t.id !== id));
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Could not delete truck.";
    }
  }, []);

  const setAvailability = useCallback<Store["setAvailability"]>(async (id, status) => {
    try {
      const truck = await api<Truck>(`/trucks/${id}/availability`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setTrucks((prev) => prev.map((t) => (t.id === id ? truck : t)));
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Could not update availability.";
    }
  }, []);

  const createBooking = useCallback<Store["createBooking"]>((truck, input) => {
    if (truck.status !== "AVAILABLE") return "This truck is not available to book.";
    if (hasActiveTrip(state.bookings, truck.id)) {
      return "This truck already has an active booking.";
    }
    const booking: Booking = {
      ...input,
      id: uid("b"),
      agreedPrice: input.agreedPrice ?? "",
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, bookings: [booking, ...s.bookings] }));
    setTrucks((prev) =>
      prev.map((t) => (t.id === truck.id ? { ...t, status: "UNAVAILABLE" } : t)),
    );
    return null;
  }, [state.bookings]);

  const setAgreedPrice = useCallback((id: string, price: string) => {
    const booking = state.bookings.find((b) => b.id === id);
    if (!booking) return "Booking not found.";
    if (booking.status !== "PENDING") {
      return "Price can only be set while the request is pending.";
    }
    setState((s) => ({
      ...s,
      bookings: s.bookings.map((b) =>
        b.id === id ? { ...b, agreedPrice: price.trim() } : b,
      ),
    }));
    return null;
  }, [state.bookings]);

  const setBookingStatus = useCallback<Store["setBookingStatus"]>((id, status) => {
    const booking = state.bookings.find((b) => b.id === id);
    if (!booking) return "Booking not found.";
    if (status === "ACCEPTED" && !booking.agreedPrice.trim()) {
      return "Agree a price first, then accept or reject.";
    }

    setState((s) => ({
      ...s,
      bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
    }));
    if (status === "ACCEPTED") {
      setTrucks((prev) =>
        prev.map((t) => (t.id === booking.truckId ? { ...t, status: "UNAVAILABLE" } : t)),
      );
    }
    if (status === "REJECTED" || status === "COMPLETED") {
      setTrucks((prev) =>
        prev.map((t) => (t.id === booking.truckId ? { ...t, status: "AVAILABLE" } : t)),
      );
    }
    return null;
  }, [state.bookings]);

  const reportProblem = useCallback<Store["reportProblem"]>((bookingId, reason) => {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) return "Booking not found.";
    const dispute: Dispute = {
      id: uid("d"),
      bookingId,
      raisedBy: booking.importerId,
      reason,
      status: "OPEN",
      resolutionNotes: "",
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      disputes: [dispute, ...s.disputes],
      bookings: s.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: "DISPUTED" } : b,
      ),
    }));
    setTrucks((prev) =>
      prev.map((t) => (t.id === booking.truckId ? { ...t, status: "UNAVAILABLE" } : t)),
    );
    return null;
  }, [state.bookings]);

  const resolveDispute = useCallback<Store["resolveDispute"]>((disputeId, notes) => {
    const dispute = state.disputes.find((d) => d.id === disputeId);
    if (!dispute) return "Dispute not found.";
    const booking = state.bookings.find((b) => b.id === dispute.bookingId);
    setState((s) => ({
      ...s,
      disputes: s.disputes.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              status: "RESOLVED",
              resolutionNotes: notes,
              resolvedAt: new Date().toISOString(),
            }
          : d,
      ),
      bookings: s.bookings.map((b) =>
        b.id === dispute.bookingId ? { ...b, status: "COMPLETED" } : b,
      ),
    }));
    if (booking) {
      setTrucks((prev) =>
        prev.map((t) => (t.id === booking.truckId ? { ...t, status: "AVAILABLE" } : t)),
      );
    }
    return null;
  }, [state.bookings, state.disputes]);

  const setUserActive = useCallback((userId: string, active: boolean) => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === userId ? { ...u, active } : u)),
    }));
  }, []);

  const resetDemo = useCallback(async (): Promise<string | null> => {
    try {
      await api("/demo/reset", { method: "POST" });
    } catch (err) {
      return err instanceof Error ? err.message : "Could not reset demo data.";
    }
    const next = seed();
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return refreshTrucks();
  }, [refreshTrucks]);

  const value = useMemo<Store>(
    () => ({
      ...state,
      ready,
      currentUser,
      login,
      register,
      logout,
      updateProfile,
      trucks,
      trucksLoading,
      refreshTrucks,
      fetchTruck,
      addTruck,
      updateTruck,
      deleteTruck,
      setAvailability,
      createBooking,
      setAgreedPrice,
      setBookingStatus,
      reportProblem,
      resolveDispute,
      setUserActive,
      resetDemo,
    }),
    [
      state,
      ready,
      currentUser,
      login,
      register,
      logout,
      updateProfile,
      trucks,
      trucksLoading,
      refreshTrucks,
      fetchTruck,
      addTruck,
      updateTruck,
      deleteTruck,
      setAvailability,
      createBooking,
      setAgreedPrice,
      setBookingStatus,
      reportProblem,
      resolveDispute,
      setUserActive,
      resetDemo,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useIbanga() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useIbanga must be used inside IbangaProvider");
  return ctx;
}

export function dashboardPath(role: Role) {
  if (role === "ADMIN") return "/dashboard/admin";
  if (role === "TRUCK_OWNER") return "/dashboard/owner";
  return "/dashboard/importer";
}
