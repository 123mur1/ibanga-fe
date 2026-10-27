import type { OpsData } from "@/types/ops";
import { mockDb } from "@/services/mock-db";
import type { Services } from "../contracts";
import type { Actor } from "../types";
import {
  persistOperationsChanges,
  refreshOperationsDomains,
  type OperationsDomain,
} from "./operations-records";

const MUTATING_METHODS: Partial<Record<keyof Services, readonly string[]>> = {
  cargoRequests: ["create", "update", "publishDraft", "cancel"],
  quotations: ["submit", "withdraw", "accept"],
  drivers: [
    "create",
    "update",
    "setStatus",
    "assign",
    "reassign",
    "cancelAssignment",
  ],
  trucks: ["updateProfile", "setOpsStatus"],
  shipments: [
    "recordMilestone",
    "reportDelay",
    "submitEvidence",
    "reviewEvidence",
    "syncFromBookings",
  ],
  settlements: [
    "syncEligibility",
    "approve",
    "completePayout",
    "retryPayout",
    "hold",
    "releaseHold",
    "addAdjustment",
  ],
  documents: [
    "upload",
    "resubmit",
    "review",
    "remove",
    "submitVerification",
    "reviewVerification",
    "savePolicy",
  ],
  cancellations: ["request", "review", "complete"],
  disputes: [
    "open",
    "reply",
    "addNote",
    "assign",
    "requestInfo",
    "proposeResolution",
    "decide",
    "setStatus",
  ],
  incidents: [
    "report",
    "addTimeline",
    "setStatus",
    "fileClaim",
    "decideClaim",
  ],
  support: ["create", "reply", "update"],
  notifications: [
    "markRead",
    "markAllRead",
    "setPreference",
    "publishAnnouncement",
    "removeAnnouncement",
  ],
  admin: [
    "resolveReconciliation",
    "updateAdmin",
    "updateSettings",
    "resetDemoData",
  ],
};

const SERVICE_DOMAINS: Partial<
  Record<keyof Services, readonly OperationsDomain[]>
> = {
  cargoRequests: ["cargo-requests"],
  quotations: ["quotations", "cargo-requests", "shipments"],
  drivers: ["drivers", "driver-assignments"],
  trucks: ["truck-profiles"],
  shipments: ["shipments", "settlements"],
  settlements: ["settlements", "payouts"],
  documents: ["documents", "verification-requests", "insurance-policies"],
  cancellations: ["cancellations"],
  disputes: ["dispute-cases", "shipments", "settlements"],
  incidents: ["incidents", "insurance-claims", "shipments", "settlements"],
  support: ["support-tickets"],
  notifications: [
    "notifications",
    "notification-preferences",
    "announcements",
  ],
  admin: [
    "audit-logs",
    "reconciliation",
    "admin-profiles",
    "settings",
    "announcements",
  ],
};

let mutationQueue: Promise<void> = Promise.resolve();

function actorFromArgs(args: unknown[]): Actor | undefined {
  const value = args[0];
  if (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "role" in value &&
    typeof value.role === "string"
  ) {
    return value as Actor;
  }
  return undefined;
}

async function persistMutation<T>(
  serviceName: keyof Services,
  method: (...args: never[]) => Promise<T>,
  args: unknown[],
): Promise<T> {
  const operation = mutationQueue.then(async () => {
    const before = mockDb.getSnapshot();
    try {
      const result = await method(...(args as never[]));
      const after = mockDb.getSnapshot();
      const changedDomains = await persistOperationsChanges(
        before,
        after,
        actorFromArgs(args),
      );
      const refreshDomains = [
        ...new Set([
          ...(SERVICE_DOMAINS[serviceName] ?? []),
          ...changedDomains,
        ]),
      ];
      if (refreshDomains.length) {
        await refreshOperationsDomains(
          refreshDomains,
          actorFromArgs(args),
        );
      }
      return result;
    } catch (error) {
      mockDb.replaceFromApi(before);
      throw error;
    }
  });
  mutationQueue = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}

export function createPersistedServices(services: Services): Services {
  const wrap = <T extends object>(
    serviceName: keyof Services,
    service: T,
  ): T =>
    new Proxy(service, {
      get(target, property, receiver) {
        const member = Reflect.get(target, property, receiver) as unknown;
        if (
          typeof property !== "string" ||
          typeof member !== "function" ||
          !MUTATING_METHODS[serviceName]?.includes(property)
        ) {
          return member;
        }
        return (...args: unknown[]) =>
          persistMutation(
            serviceName,
            member.bind(target) as (...args: never[]) => Promise<unknown>,
            args,
          );
      },
    });

  return {
    cargoRequests: wrap("cargoRequests", services.cargoRequests),
    quotations: wrap("quotations", services.quotations),
    drivers: wrap("drivers", services.drivers),
    trucks: wrap("trucks", services.trucks),
    shipments: wrap("shipments", services.shipments),
    settlements: wrap("settlements", services.settlements),
    documents: wrap("documents", services.documents),
    cancellations: wrap("cancellations", services.cancellations),
    disputes: wrap("disputes", services.disputes),
    incidents: wrap("incidents", services.incidents),
    support: wrap("support", services.support),
    notifications: wrap("notifications", services.notifications),
    admin: wrap("admin", services.admin),
  };
}

export function restoreOperationsCache(snapshot: OpsData) {
  mockDb.replaceFromApi(snapshot);
}
