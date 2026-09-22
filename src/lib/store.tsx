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
import {
  type Booking,
  type BookingStatus,
  type Dispute,
  type Role,
  type Truck,
  type TruckStatus,
  type User,
} from "./types";

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
    company: string | null;
    photo: string | null;
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
    company: u.company ?? "",
    photo: u.photo ?? undefined,
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
  updateProfile: (patch: Partial<Pick<User, "name" | "phone" | "location" | "company" | "photo">>) => Promise<string | null>;
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
  createBooking: (truck: Truck, input: NewBookingInput) => Promise<string | null>;
  setAgreedPrice: (id: string, price: string) => Promise<string | null>;
  setBookingStatus: (id: string, status: BookingStatus) => Promise<string | null>;
  reportProblem: (bookingId: string, reason: string) => Promise<string | null>;
  resolveDispute: (disputeId: string, notes: string) => Promise<string | null>;
  setUserActive: (userId: string, active: boolean) => void;
  resetDemo: () => Promise<string | null>;
};

const StoreContext = createContext<Store | null>(null);

function seed(): State {
  return {
    users: [],
    bookings: [],
    disputes: [],
    currentUserId: null,
  };
}

type ApiBooking = Omit<Booking, "cargoWeight"> & {
  cargoWeight: number;
  importer?: AuthPayload["user"];
  truck?: Truck;
};

function toBooking(booking: ApiBooking): Booking {
  return { ...booking, cargoWeight: String(booking.cargoWeight) };
}

export function IbangaProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(seed);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [trucksLoading, setTrucksLoading] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refreshBookings = useCallback(async (): Promise<string | null> => {
    if (!getToken()) return null;
    try {
      const [bookingData, disputeData] = await Promise.all([
        api<ApiBooking[]>("/bookings"),
        api<Dispute[]>("/disputes"),
      ]);
      const bookings = bookingData.map(toBooking);
      const relatedUsers: User[] = bookingData.flatMap((booking) => [
        ...(booking.importer ? [toUser(booking.importer)] : []),
        ...(booking.truck?.owner
          ? [{
              ...booking.truck.owner,
              role: "TRUCK_OWNER" as const,
              active: true,
              phone: booking.truck.owner.phone ?? "",
              location: booking.truck.owner.location ?? "",
              photo: booking.truck.owner.photo ?? undefined,
            }]
          : []),
      ]);
      setState((current) => ({
        ...current,
        bookings,
        disputes: disputeData,
        users: Array.from(new Map(relatedUsers.map((user) => [user.id, user])).values()),
      }));
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Could not load bookings.";
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      queueMicrotask(() => setReady(true));
      return;
    }

    api<AuthPayload["user"]>("/auth/me")
      .then((user) => {
        setAuthUser(toUser(user));
        void refreshBookings();
      })
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, [refreshBookings]);

  const currentUser = authUser;

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await api<AuthPayload>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      setAuthUser(toUser(data.user));
      void refreshBookings();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Login failed.";
    }
  }, [refreshBookings]);

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
      void refreshBookings();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Registration failed.";
    }
  }, [refreshBookings]);

  const logout = useCallback(() => {
    setToken(null);
    setAuthUser(null);
  }, []);

  const updateProfile = useCallback<Store["updateProfile"]>(async (patch) => {
    try {
      const user = await api<AuthPayload["user"]>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setAuthUser(toUser(user));
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Could not update profile.";
    }
  }, []);

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

  const createBooking = useCallback<Store["createBooking"]>(async (truck, input) => {
    try {
      const created = await api<ApiBooking>("/bookings", {
        method: "POST",
        body: JSON.stringify({ ...input, truckId: truck.id, cargoWeight: input.cargoWeight }),
      });
      const booking = toBooking(created);
      setState((s) => ({ ...s, bookings: [booking, ...s.bookings] }));
      setTrucks((prev) => prev.map((item) => item.id === truck.id ? { ...item, status: "UNAVAILABLE" } : item));
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Could not create booking.";
    }
  }, []);

  const setAgreedPrice = useCallback<Store["setAgreedPrice"]>(async (id, price) => {
    try {
      const updated = toBooking(await api<ApiBooking>(`/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ agreedPrice: price }) }));
      setState((s) => ({ ...s, bookings: s.bookings.map((b) => b.id === id ? updated : b) }));
      return null;
    } catch (err) { return err instanceof Error ? err.message : "Could not agree price."; }
  }, []);

  const setBookingStatus = useCallback<Store["setBookingStatus"]>(async (id, status) => {
    try {
      const updated = toBooking(await api<ApiBooking>(`/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }));
      setState((s) => ({ ...s, bookings: s.bookings.map((b) => b.id === id ? updated : b) }));
      if (status === "REJECTED" || status === "COMPLETED") setTrucks((items) => items.map((item) => item.id === updated.truckId ? { ...item, status: "AVAILABLE" } : item));
      return null;
    } catch (err) { return err instanceof Error ? err.message : "Could not update booking."; }
  }, []);

  const reportProblem = useCallback<Store["reportProblem"]>(async (bookingId, reason) => {
    try {
      await api<Dispute>("/disputes", { method: "POST", body: JSON.stringify({ bookingId, reason }) });
      return refreshBookings();
    } catch (err) { return err instanceof Error ? err.message : "Could not report problem."; }
  }, [refreshBookings]);

  const resolveDispute = useCallback<Store["resolveDispute"]>(async (disputeId, notes) => {
    try {
      await api(`/disputes/${disputeId}/resolve`, { method: "PATCH", body: JSON.stringify({ resolutionNotes: notes }) });
      return refreshBookings();
    } catch (err) { return err instanceof Error ? err.message : "Could not resolve dispute."; }
  }, [refreshBookings]);

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
    await refreshBookings();
    return refreshTrucks();
  }, [refreshBookings, refreshTrucks]);

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
