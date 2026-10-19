import { ADMIN_ROLE_PRESETS } from "@/config/permissions";
import type { Announcement, NotificationCategory, NotificationChannelPrefs, Permission } from "@/types/ops";
import type { AdminService, NotificationService } from "../contracts";
import { mockDb } from "../mock-db";
import type { Actor } from "../types";
import { audit, commit, conflict, db, delay, forbid, invalid, newId, notFound, nowIso, queryList, replaceById } from "./util";

export const NOTIFICATION_CATEGORIES: { key: NotificationCategory; label: string }[] = [
  { key: "QUOTATION", label: "Quotations" },
  { key: "BOOKING", label: "Bookings" },
  { key: "PAYMENT", label: "Payments" },
  { key: "SHIPMENT", label: "Shipments" },
  { key: "DELIVERY", label: "Delivery evidence" },
  { key: "SETTLEMENT", label: "Settlements & payouts" },
  { key: "REFUND", label: "Refunds & cancellations" },
  { key: "DOCUMENT", label: "Documents & verification" },
  { key: "INCIDENT", label: "Incidents" },
  { key: "DISPUTE", label: "Disputes" },
  { key: "SUPPORT", label: "Support" },
  { key: "SYSTEM", label: "System" },
];

const DEFAULT_PREFS: NotificationChannelPrefs = { inApp: true, email: true, sms: false, push: false };

function permissionsOf(actor: Actor) {
  return db().adminProfiles.find((profile) => profile.userId === actor.id)?.permissions ?? [];
}

function needs(actor: Actor, permission: Permission) {
  if (actor.role !== "ADMIN") forbid("Only administrators can do this.");
  if (!permissionsOf(actor).includes(permission)) forbid("Your administrator role does not include this permission.");
}

export const notificationService: NotificationService = {
  async list(userId) {
    await delay(150);
    return db().notifications.filter((item) => item.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async markRead(userId, id) {
    mockDb.update((data) => ({ ...data, notifications: data.notifications.map((item) => (item.id === id && item.userId === userId ? { ...item, read: true } : item)) }));
  },

  async markAllRead(userId) {
    await delay(150);
    mockDb.update((data) => ({ ...data, notifications: data.notifications.map((item) => (item.userId === userId ? { ...item, read: true } : item)) }));
  },

  async getPreferences(userId) {
    const stored = db().notificationPrefs[userId] ?? {};
    return Object.fromEntries(NOTIFICATION_CATEGORIES.map(({ key }) => [key, stored[key] ?? DEFAULT_PREFS])) as Record<NotificationCategory, NotificationChannelPrefs>;
  },

  async setPreference(userId, category, prefs) {
    await delay(150);
    mockDb.update((data) => ({
      ...data,
      notificationPrefs: { ...data.notificationPrefs, [userId]: { ...data.notificationPrefs[userId], [category]: prefs } },
    }));
  },

  async listAnnouncements(actor) {
    await delay(120);
    const now = Date.now();
    return db().announcements
      .filter((item) => actor.role === "ADMIN" || ((item.audience === "ALL" || item.audience === actor.role) && (!item.expiresAt || new Date(item.expiresAt).getTime() > now)))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  },

  async publishAnnouncement(actor, input) {
    await delay();
    needs(actor, "announcements");
    if (input.title.trim().length < 4) invalid("Enter a title.", { title: "Enter a title." });
    if (input.body.trim().length < 10) invalid("Write the announcement text.", { body: "Enter at least 10 characters." });
    const announcement: Announcement = { ...input, title: input.title.trim(), body: input.body.trim(), id: newId("an"), publishedAt: nowIso(), publishedBy: actor.id };
    commit((data) => ({ ...data, announcements: [announcement, ...data.announcements] }), {
      audit: [audit(actor, "Published announcement", "Announcement", announcement.id, announcement.title)],
    });
    return announcement;
  },

  async removeAnnouncement(actor, id) {
    await delay(200);
    needs(actor, "announcements");
    commit((data) => ({ ...data, announcements: data.announcements.filter((item) => item.id !== id) }), {
      audit: [audit(actor, "Removed announcement", "Announcement", id, "")],
    });
  },
};

export const adminService: AdminService = {
  async listAudit(actor, query) {
    await delay(200);
    needs(actor, "audit");
    return queryList(db().auditLog, { sort: { field: "at", direction: "desc" }, ...query }, (item) => `${item.actorName} ${item.action} ${item.entityType} ${item.entityRef} ${item.detail}`);
  },

  async listReconciliation(actor, query) {
    await delay(200);
    needs(actor, "reconciliation");
    return queryList(db().reconciliation, { sort: { field: "date", direction: "desc" }, ...query }, (item) => `${item.ref} ${item.providerRef} ${item.bookingId ?? ""} ${item.status} ${item.kind}`);
  },

  async resolveReconciliation(actor, id, note) {
    await delay();
    needs(actor, "reconciliation");
    const record = db().reconciliation.find((item) => item.id === id);
    if (!record) notFound("Reconciliation record");
    if (record.status === "MATCHED") conflict("This record is already matched.");
    if (note.trim().length < 5) invalid("Explain how this record was reviewed.", { note: "Enter a note." });
    const updated = { ...record, status: "MATCHED" as const, note: `[Demonstration review by ${actor.name}] ${note.trim()}` };
    commit((data) => ({ ...data, reconciliation: replaceById(data.reconciliation, id, () => updated) }), {
      audit: [audit(actor, "Reviewed reconciliation record (demonstration)", "Reconciliation", record.ref, note.trim())],
    });
    return updated;
  },

  async listAdmins(actor) {
    await delay(150);
    needs(actor, "admins");
    return db().adminProfiles;
  },

  async updateAdmin(actor, userId, input) {
    await delay();
    needs(actor, "admins");
    const target = db().adminProfiles.find((profile) => profile.userId === userId);
    if (!target) notFound("Administrator");
    if (userId === actor.id && !input.permissions.includes("admins")) conflict("You cannot remove your own permission to manage administrators.");
    if (!input.permissions.length) invalid("Choose at least one permission.");
    const updated = { userId, adminRole: input.adminRole, permissions: input.permissions };
    commit((data) => ({ ...data, adminProfiles: data.adminProfiles.map((profile) => (profile.userId === userId ? updated : profile)) }), {
      audit: [audit(actor, "Updated administrator permissions", "Administrator", userId, `${ADMIN_ROLE_PRESETS[input.adminRole].label}: ${input.permissions.length} permissions`)],
    });
    return updated;
  },

  async getSettings() {
    return db().settings;
  },

  async updateSettings(actor, patch) {
    await delay();
    needs(actor, "settings");
    const errors: Record<string, string> = {};
    if (patch.platformFeePct !== undefined && !(patch.platformFeePct >= 0 && patch.platformFeePct <= 30)) errors.platformFeePct = "Enter a percentage between 0 and 30.";
    if (patch.quotationValidityDays !== undefined && !(patch.quotationValidityDays >= 1 && patch.quotationValidityDays <= 30)) errors.quotationValidityDays = "Enter 1 to 30 days.";
    if (patch.documentWarningDays !== undefined && !(patch.documentWarningDays >= 1 && patch.documentWarningDays <= 180)) errors.documentWarningDays = "Enter 1 to 180 days.";
    if (Object.keys(errors).length) invalid("Check the settings.", errors);
    const updated = { ...db().settings, ...patch };
    commit((data) => ({ ...data, settings: updated }), {
      audit: [audit(actor, "Updated system settings", "Settings", "platform", JSON.stringify(patch))],
    });
    return updated;
  },

  async resetDemoData() {
    await delay(300);
    mockDb.reset();
  },

  snapshot() {
    return db();
  },
};
