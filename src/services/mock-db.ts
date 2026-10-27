/**
 * In-browser "database" for the demonstration data. It is NOT a backend: it keeps one OpsData
 * object in memory, persists it to localStorage and notifies React through `useSyncExternalStore`.
 * Never store real secrets, identity numbers or payment credentials here.
 *
 * Replace the mock services (not this file's callers) with API clients when a backend exists.
 */
import { env } from "@/config/env";
import { buildSeedOpsData } from "@/mocks";
import type { OpsData } from "@/types/ops";

type Listener = () => void;
type Stored = { version: number; data: OpsData };

function emptyOpsData(): OpsData {
  return {
    cargoRequests: [],
    quotations: [],
    drivers: [],
    driverAssignments: [],
    truckProfiles: [],
    shipments: [],
    settlements: [],
    payouts: [],
    documents: [],
    verificationRequests: [],
    cancellations: [],
    disputeCases: [],
    incidents: [],
    insurancePolicies: [],
    insuranceClaims: [],
    supportTickets: [],
    notifications: [],
    notificationPrefs: {},
    announcements: [],
    auditLog: [],
    reconciliation: [],
    adminProfiles: [],
    settings: {
      platformFeePct: 0,
      quotationValidityDays: 0,
      documentWarningDays: 0,
      cancellationFreeWindowHours: 0,
      maxQuotationsPerRequest: 0,
      maintenanceBanner: "",
    },
  };
}

class MockDb {
  private data: OpsData;
  private readonly seed: OpsData;
  private readonly listeners = new Set<Listener>();
  private hydrated = false;

  constructor() {
    this.seed = env.dataSource === "api" ? emptyOpsData() : buildSeedOpsData();
    this.data = this.seed;
  }

  /** Server render and first client render use the same seed, so hydration always matches. */
  getServerSnapshot = (): OpsData => this.seed;

  getSnapshot = (): OpsData => {
    if (!this.hydrated && typeof window !== "undefined") this.hydrate();
    return this.data;
  };

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === env.storageKey) {
        this.hydrated = false;
        this.hydrate();
        this.emit();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      this.listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  /** Apply an immutable update and notify subscribers. */
  update(change: (current: OpsData) => OpsData): void {
    const current = this.getSnapshot();
    const next = change(current);
    if (next === current) return;
    this.data = next;
    if (env.dataSource === "mock") this.persist();
    this.emit();
  }

  /** Replace the in-memory cache with records returned by the authenticated API. */
  replaceFromApi(data: OpsData): void {
    if (env.dataSource !== "api") return;
    this.data = data;
    this.hydrated = true;
    this.emit();
  }

  /** Discard all demonstration changes and restore the seed dataset. */
  reset(): void {
    this.data = buildSeedOpsData();
    this.hydrated = true;
    try {
      window.localStorage.removeItem(env.storageKey);
    } catch {
      /* storage unavailable */
    }
    this.emit();
  }

  private hydrate() {
    this.hydrated = true;
    if (env.dataSource === "api") return;
    try {
      const raw = window.localStorage.getItem(env.storageKey);
      if (!raw) return;
      const stored = JSON.parse(raw) as Stored;
      if (stored.version === env.mockDataVersion && stored.data?.cargoRequests) {
        this.data = { ...buildSeedOpsData(), ...stored.data };
      }
    } catch {
      /* corrupted or unavailable storage: fall back to the seed */
    }
  }

  private persist() {
    try {
      const payload: Stored = { version: env.mockDataVersion, data: this.data };
      window.localStorage.setItem(env.storageKey, JSON.stringify(payload));
    } catch {
      /* storage full or unavailable: the in-memory data still works */
    }
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}

export const mockDb = new MockDb();
