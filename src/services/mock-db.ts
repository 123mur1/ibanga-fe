/**
 * In-memory cache of the operations records loaded from the API. It keeps one OpsData object and
 * notifies React through `useSyncExternalStore`; the service layer reads and updates it and the
 * persisted services write every change back to the API. It starts empty and is never saved in
 * the browser.
 */
import type { OpsData } from "@/types/ops";

type Listener = () => void;

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
  private data: OpsData = emptyOpsData();
  private readonly empty: OpsData = this.data;
  private readonly listeners = new Set<Listener>();

  /** Server render and first client render both start empty, so hydration always matches. */
  getServerSnapshot = (): OpsData => this.empty;

  getSnapshot = (): OpsData => this.data;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Apply an immutable update and notify subscribers. */
  update(change: (current: OpsData) => OpsData): void {
    const next = change(this.data);
    if (next === this.data) return;
    this.data = next;
    this.emit();
  }

  /** Replace the cache with records returned by the authenticated API. */
  replaceFromApi(data: OpsData): void {
    this.data = data;
    this.emit();
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}

export const mockDb = new MockDb();
