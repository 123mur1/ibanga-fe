/**
 * Assembles the complete demonstration dataset. Every record refers to others by stable IDs
 * (users, trucks and bookings come from `@/lib/mock-data`). Edit datasets in this folder, never
 * inside components.
 */
import type { NotificationPrefs, OpsData } from "@/types/ops";
import { cargoRequests, quotations } from "./cargo";
import { cancellations, disputeCases, incidents, insuranceClaims, supportTickets } from "./cases";
import { documents, insurancePolicies, verificationRequests } from "./documents";
import { adminProfiles, driverAssignments, drivers, truckProfiles } from "./people";
import { announcements, auditLog, notifications, platformSettings, reconciliation } from "./platform";
import { payouts, settlements, shipments } from "./shipments";

const clone = <T,>(value: T): T => structuredClone(value);

export function buildSeedOpsData(): OpsData {
  return {
    cargoRequests: clone(cargoRequests),
    quotations: clone(quotations),
    drivers: clone(drivers),
    driverAssignments: clone(driverAssignments),
    truckProfiles: clone(truckProfiles),
    shipments: clone(shipments),
    settlements: clone(settlements),
    payouts: clone(payouts),
    documents: clone(documents),
    verificationRequests: clone(verificationRequests),
    cancellations: clone(cancellations),
    disputeCases: clone(disputeCases),
    incidents: clone(incidents),
    insurancePolicies: clone(insurancePolicies),
    insuranceClaims: clone(insuranceClaims),
    supportTickets: clone(supportTickets),
    notifications: clone(notifications),
    notificationPrefs: {} as NotificationPrefs,
    announcements: clone(announcements),
    auditLog: clone(auditLog),
    reconciliation: clone(reconciliation),
    adminProfiles: clone(adminProfiles),
    settings: clone(platformSettings),
  };
}
