import { api, ApiError } from "@/lib/api";
import { mockDb } from "@/services/mock-db";
import type { OpsData } from "@/types/ops";
import type { Actor, Paged } from "../types";
import { ServiceError } from "../types";

export type OperationsDomain =
  | "cargo-requests"
  | "quotations"
  | "drivers"
  | "driver-assignments"
  | "truck-profiles"
  | "shipments"
  | "settlements"
  | "payouts"
  | "documents"
  | "verification-requests"
  | "cancellations"
  | "dispute-cases"
  | "incidents"
  | "insurance-policies"
  | "insurance-claims"
  | "support-tickets"
  | "notifications"
  | "notification-preferences"
  | "announcements"
  | "audit-logs"
  | "reconciliation"
  | "admin-profiles"
  | "settings";

type RecordData = Record<string, unknown> & { id: string };
type ApiActor = Actor & { adminUserIds?: string[] };
type ApiPage<T> = Paged<T>;

const ADMIN_ONLY_DOMAINS: readonly OperationsDomain[] = [
  "audit-logs",
  "reconciliation",
  "admin-profiles",
  "settings",
];

let hasStoredSettings = false;

function serviceError(error: unknown): never {
  if (!(error instanceof ApiError)) throw error;
  const code =
    error.status === 401 || error.status === 403
      ? "FORBIDDEN"
      : error.status === 404
        ? "NOT_FOUND"
        : error.status === 409
          ? "CONFLICT"
          : "VALIDATION";
  throw new ServiceError(code, error.message, error.fieldErrors);
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await api<T>(path, init);
  } catch (error) {
    serviceError(error);
  }
}

function queryString(page = 1, pageSize = 1000) {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return `?${query.toString()}`;
}

export async function listOperationsRecords<T extends RecordData>(
  domain: OperationsDomain,
  page = 1,
  pageSize = 1000,
): Promise<ApiPage<T>> {
  return call<ApiPage<T>>(
    `/operations/${domain}${queryString(page, pageSize)}`,
  );
}

export async function getOperationsRecord<T extends RecordData>(
  domain: OperationsDomain,
  id: string,
): Promise<T> {
  return call<T>(`/operations/${domain}/${encodeURIComponent(id)}`);
}

export async function createOperationsRecord<T extends RecordData>(
  domain: OperationsDomain,
  data: T,
): Promise<T> {
  return call<T>(`/operations/${domain}`, {
    method: "POST",
    body: JSON.stringify({ data }),
  });
}

export async function updateOperationsRecord<T extends RecordData>(
  domain: OperationsDomain,
  data: T,
): Promise<T> {
  return call<T>(
    `/operations/${domain}/${encodeURIComponent(data.id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ data }),
    },
  );
}

export async function removeOperationsRecord(
  domain: OperationsDomain,
  id: string,
): Promise<void> {
  await call(`/operations/${domain}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

const DATASET_DOMAINS = [
  ["cargoRequests", "cargo-requests"],
  ["quotations", "quotations"],
  ["drivers", "drivers"],
  ["driverAssignments", "driver-assignments"],
  ["truckProfiles", "truck-profiles"],
  ["shipments", "shipments"],
  ["settlements", "settlements"],
  ["payouts", "payouts"],
  ["documents", "documents"],
  ["verificationRequests", "verification-requests"],
  ["cancellations", "cancellations"],
  ["disputeCases", "dispute-cases"],
  ["incidents", "incidents"],
  ["insurancePolicies", "insurance-policies"],
  ["insuranceClaims", "insurance-claims"],
  ["supportTickets", "support-tickets"],
  ["notifications", "notifications"],
  ["announcements", "announcements"],
  ["auditLog", "audit-logs"],
  ["reconciliation", "reconciliation"],
  ["adminProfiles", "admin-profiles"],
] as const satisfies readonly (readonly [keyof OpsData, OperationsDomain])[];

const ADMIN_PERMISSIONS: NonNullable<OpsData["adminProfiles"][number]>["permissions"] = [
  "users",
  "verifications",
  "trucks",
  "drivers",
  "cargo",
  "bookings",
  "shipments",
  "payments",
  "settlements",
  "refunds",
  "disputes",
  "incidents",
  "insurance",
  "documents",
  "reconciliation",
  "reports",
  "announcements",
  "support",
  "audit",
  "settings",
  "admins",
];

function defaultSettings(): OpsData["settings"] {
  return {
    platformFeePct: 0,
    quotationValidityDays: 0,
    documentWarningDays: 0,
    cancellationFreeWindowHours: 0,
    maxQuotationsPerRequest: 0,
    maintenanceBanner: "",
  };
}

export async function loadOperationsSnapshot(actor: ApiActor): Promise<OpsData> {
  const data: OpsData = {
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
    settings: defaultSettings(),
  };
  const readableDomains = DATASET_DOMAINS.filter(
    ([, domain]) =>
      actor.role === "ADMIN" ||
      !ADMIN_ONLY_DOMAINS.includes(domain),
  );
  const pages = await Promise.all(
    readableDomains.map(([, domain]) => listOperationsRecords(domain)),
  );

  readableDomains.forEach(([key], index) => {
    const records = pages[index].items;
    Object.assign(data, { [key]: records });
  });

  const preferencePage = await listOperationsRecords<RecordData>(
    "notification-preferences",
  );
  data.notificationPrefs = Object.fromEntries(
    preferencePage.items.map((record) => [
      record.userId ?? record.id,
      record.preferences ?? {},
    ]),
  ) as OpsData["notificationPrefs"];

  if (actor.role === "ADMIN") {
    const settingsPage = await listOperationsRecords<RecordData>("settings");
    const settings = settingsPage.items[0];
    hasStoredSettings = Boolean(settings);
    if (settings) {
      const { id: _id, ...values } = settings;
      data.settings = values as OpsData["settings"];
    }
    data.adminProfiles = [
      ...data.adminProfiles,
      ...(actor.adminUserIds ?? [actor.id])
        .filter(
          (userId) =>
            !data.adminProfiles.some((profile) => profile.userId === userId),
        )
        .map((userId) => ({
          userId,
          adminRole: "SUPER_ADMIN" as const,
          permissions: ADMIN_PERMISSIONS,
        })),
    ];
  }
  return data;
}

type ChangedRecord = { domain: OperationsDomain; record: RecordData };

function recordsById(value: unknown): Map<string, RecordData> {
  if (!Array.isArray(value)) return new Map();
  return new Map(
    value
      .filter(
        (item): item is RecordData =>
          typeof item === "object" &&
          item !== null &&
          !Array.isArray(item) &&
          typeof (item as { id?: unknown }).id === "string",
      )
      .map((record) => [record.id, record]),
  );
}

function equalRecord(left: RecordData, right: RecordData) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function changedRecords(before: OpsData, after: OpsData, actor?: Actor) {
  const creates: ChangedRecord[] = [];
  const updates: ChangedRecord[] = [];
  const removals: { domain: OperationsDomain; id: string }[] = [];
  for (const [key, domain] of DATASET_DOMAINS) {
    // Audit records are server-owned; the API does not accept client-created audit events.
    if (domain === "audit-logs") continue;
    // A driver may submit documents, but only an owner/admin can edit the driver profile.
    // Verification status is persisted by the administrator's review action.
    if (domain === "drivers" && actor?.role === "DRIVER") continue;
    const oldRecords = recordsById(before[key]);
    const newRecords = recordsById(after[key]);
    for (const [id, record] of newRecords) {
      const previous = oldRecords.get(id);
      if (!previous) creates.push({ domain, record });
      else if (!equalRecord(previous, record)) updates.push({ domain, record });
    }
    for (const id of oldRecords.keys()) {
      if (!newRecords.has(id)) removals.push({ domain, id });
    }
  }
  const oldPreferences = before.notificationPrefs;
  const newPreferences = after.notificationPrefs;
  for (const userId of Object.keys(oldPreferences)) {
    if (!newPreferences[userId]) {
      removals.push({ domain: "notification-preferences", id: userId });
    }
  }
  for (const [userId, preferences] of Object.entries(newPreferences)) {
    const old = oldPreferences[userId];
    const record = { id: userId, userId, preferences } as RecordData;
    const previous = old
      ? ({ id: userId, userId, preferences: old } as RecordData)
      : undefined;
    if (!previous) creates.push({ domain: "notification-preferences", record });
    else if (!equalRecord(previous, record)) {
      updates.push({ domain: "notification-preferences", record });
    }
  }
  if (
    !equalRecord(
      { id: "platform", ...before.settings },
      { id: "platform", ...after.settings },
    )
  ) {
    const record = { id: "platform", ...after.settings };
    (hasStoredSettings ? updates : creates).push({
      domain: "settings",
      record,
    });
  }
  return { creates, updates, removals };
}

export async function persistOperationsChanges(
  before: OpsData,
  after: OpsData,
  actor?: Actor,
): Promise<OperationsDomain[]> {
  const changes = changedRecords(before, after, actor);
  for (const { domain, record } of changes.creates) {
    await createOperationsRecord(domain, record);
  }
  for (const { domain, record } of changes.updates) {
    await updateOperationsRecord(domain, record);
  }
  for (const { domain, id } of changes.removals) {
    await removeOperationsRecord(domain, id);
  }
  return [
    ...new Set([
      ...changes.creates.map(({ domain }) => domain),
      ...changes.updates.map(({ domain }) => domain),
      ...changes.removals.map(({ domain }) => domain),
    ]),
  ];
}

const DATASET_KEYS: Partial<Record<OperationsDomain, keyof OpsData>> =
  Object.fromEntries(
    DATASET_DOMAINS.map(([key, domain]) => [domain, key]),
  );

export async function refreshOperationsDomains(
  domains: readonly OperationsDomain[],
  actor?: ApiActor,
): Promise<void> {
  const uniqueDomains = [...new Set(domains)];
  const dataDomains = uniqueDomains.filter(
    (domain) => DATASET_KEYS[domain] !== undefined,
  );
  const pages = await Promise.all(
    dataDomains.map((domain) => listOperationsRecords(domain)),
  );
  const changes: Partial<OpsData> = {};
  dataDomains.forEach((domain, index) => {
    const key = DATASET_KEYS[domain];
    if (key) Object.assign(changes, { [key]: pages[index].items });
  });

  if (uniqueDomains.includes("notification-preferences")) {
    const page = await listOperationsRecords<RecordData>(
      "notification-preferences",
    );
    changes.notificationPrefs = Object.fromEntries(
      page.items.map((record) => [
        record.userId ?? record.id,
        record.preferences ?? {},
      ]),
    ) as OpsData["notificationPrefs"];
  }
  if (uniqueDomains.includes("settings")) {
    const page = await listOperationsRecords<RecordData>("settings");
    const settings = page.items[0];
    hasStoredSettings = Boolean(settings);
    if (settings) {
      const { id: _id, ...values } = settings;
      changes.settings = values as OpsData["settings"];
    }
  }
  if (uniqueDomains.includes("admin-profiles") && actor?.role === "ADMIN") {
    const profiles = (changes.adminProfiles ?? []) as OpsData["adminProfiles"];
    const adminIds = actor.adminUserIds ?? [actor.id];
    changes.adminProfiles = [
      ...profiles,
      ...adminIds
        .filter((id) => !profiles.some((profile) => profile.userId === id))
        .map((userId) => ({
          userId,
          adminRole: "SUPER_ADMIN" as const,
          permissions: ADMIN_PERMISSIONS,
        })),
    ];
  }
  const current = mockDb.getSnapshot();
  mockDb.replaceFromApi({ ...current, ...changes });
}
