/** Shared helpers for the mock service implementations. */
import { env } from "@/config/env";
import type { AuditLogEntry, NotificationCategory, OpsData, OpsNotification, Permission } from "@/types/ops";
import { mockDb } from "../mock-db";
import { ServiceError, type Actor, type ListQuery, type Paged } from "../types";
import { recomputeSettlements } from "./sync";

/**
 * Simulated network latency so loading states are visible in demonstration mode. With the API
 * the real request already takes time, so adding more would only slow every screen down.
 */
export function delay(ms: number = env.mockLatencyMs): Promise<void> {
  if (env.dataSource === "api") return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}`;
}

export const nowIso = () => new Date().toISOString();

/** Next human-readable reference such as "CR-2026-0013", based on records already stored. */
export function nextRef(prefix: string, existing: { ref: string }[]): string {
  const highest = existing.reduce((max, item) => {
    const serial = Number(item.ref.split("-").at(-1));
    return Number.isFinite(serial) ? Math.max(max, serial) : max;
  }, 0);
  return `${prefix}-${new Date().getFullYear()}-${String(highest + 1).padStart(4, "0")}`;
}

export function db(): OpsData {
  return mockDb.getSnapshot();
}

export function notFound(what: string): never {
  throw new ServiceError("NOT_FOUND", `${what} could not be found.`);
}

export function forbid(message = "You do not have access to this record."): never {
  throw new ServiceError("FORBIDDEN", message);
}

export function invalid(message: string, fieldErrors?: Record<string, string>): never {
  throw new ServiceError("VALIDATION", message, fieldErrors);
}

export function conflict(message: string): never {
  throw new ServiceError("CONFLICT", message);
}

export function replaceById<T extends { id: string }>(items: T[], id: string, change: (item: T) => T): T[] {
  return items.map((item) => (item.id === id ? change(item) : item));
}

export function audit(actor: Actor, action: string, entityType: string, entityRef: string, detail: string): AuditLogEntry {
  return {
    id: newId("al"),
    at: nowIso(),
    actorId: actor.id,
    actorName: actor.name,
    action,
    entityType,
    entityRef,
    detail,
  };
}

export function notification(
  userId: string,
  category: NotificationCategory,
  title: string,
  body: string,
  href?: string,
): OpsNotification {
  return { id: newId("n"), userId, category, title, body, href, read: false, createdAt: nowIso() };
}

/** Generic search, exact-match filters, sorting and pagination over an in-memory list. */
export function queryList<T>(items: T[], query: ListQuery | undefined, searchText: (item: T) => string): Paged<T> {
  const { search = "", filters = {}, sort, page = 1, pageSize = 10 } = query ?? {};
  const needle = search.trim().toLowerCase();
  let result = items.filter((item) => {
    if (needle && !searchText(item).toLowerCase().includes(needle)) return false;
    return Object.entries(filters).every(([field, value]) => !value || String((item as Record<string, unknown>)[field]) === value);
  });
  if (sort) {
    const direction = sort.direction === "asc" ? 1 : -1;
    result = [...result].sort((a, b) => {
      const left = (a as Record<string, unknown>)[sort.field];
      const right = (b as Record<string, unknown>)[sort.field];
      if (left === right) return 0;
      return (left as string | number) > (right as string | number) ? direction : -direction;
    });
  }
  const total = result.length;
  const start = (Math.max(1, page) - 1) * pageSize;
  return { items: result.slice(start, start + pageSize), total, page, pageSize };
}

/** Applies several changes to the database in one update, plus audit and notification records. */
export function commit(
  change: (data: OpsData) => OpsData,
  extras: { audit?: AuditLogEntry[]; notifications?: OpsNotification[] } = {},
): void {
  mockDb.update((data) => {
    const next = recomputeSettlements(change(data));
    if (next === data && !extras.audit?.length && !extras.notifications?.length) return data;
    return {
      ...next,
      auditLog: extras.audit?.length ? [...extras.audit, ...next.auditLog] : next.auditLog,
      notifications: extras.notifications?.length ? [...extras.notifications, ...next.notifications] : next.notifications,
    };
  });
}

/**
 * Requires an administrator who holds `permission`. Mirrors what the backend must enforce on every
 * request: being an admin is not enough, the admin role must include the area.
 */
export function requirePermission(actor: Actor, permission: Permission): void {
  if (actor.role !== "ADMIN") forbid("Only administrators can do this.");
  const profile = db().adminProfiles.find((item) => item.userId === actor.id);
  if (!profile?.permissions.includes(permission)) forbid("Your administrator role does not include this permission.");
}

export function isAdmin(actor: Actor) {
  return actor.role === "ADMIN";
}
