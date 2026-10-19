/** Demonstration notifications, announcements, audit log, reconciliation records and settings. SAMPLE DATA. */
import { DEFAULT_DOCUMENT_WARNING_DAYS, DEFAULT_QUOTATION_VALIDITY_DAYS } from "@/config/business-rules";
import type {
  Announcement,
  AuditLogEntry,
  NotificationCategory,
  OpsNotification,
  PlatformSettings,
  ReconciliationRecord,
} from "@/types/ops";
import { at, ref } from "./helpers";

let notificationSerial = 0;
function notify(userId: string, category: NotificationCategory, title: string, body: string, when: string, href?: string, read = false): OpsNotification {
  notificationSerial += 1;
  return { id: `n${notificationSerial}`, userId, category, title, body, href, read, createdAt: when };
}

export const notifications: OpsNotification[] = [
  // Importer: Jeanine
  notify("u-importer", "QUOTATION", "2 new quotations received", "Two truck owners quoted on your coffee export request (CR-2026-0002).", at(-2, 9, 30), "/dashboard/importer/cargo-requests/cr2"),
  notify("u-importer", "QUOTATION", "A quotation was submitted", "Ndayi Transport quoted RWF 820,000 for CR-2026-0002.", at(-2, 14), "/dashboard/importer/cargo-requests/cr2"),
  notify("u-importer", "SHIPMENT", "Shipment delayed", "Your Musanze to Kampala shipment is delayed at the Gatuna border. New estimate: tomorrow.", at(-1, 11), "/dashboard/importer/shipments/sh2"),
  notify("u-importer", "BOOKING", "Booking confirmed", "Palletised household goods to Mombasa is confirmed and paid.", at(-7, 10), "/dashboard/importer/bookings/b6", true),
  notify("u-importer", "PAYMENT", "Payment held", "Your payment of RWF 460,000 is held by iBanga until delivery (demonstration).", at(-7, 10, 5), "/dashboard/importer/payments/b6", true),
  notify("u-importer", "SHIPMENT", "Shipment departed", "Your Kigali to Mombasa shipment left the pickup point.", at(-4, 9), "/dashboard/importer/shipments/sh6", true),
  notify("u-importer", "REFUND", "Cancellation request received", "Your cancellation request CXL-2026-0001 is waiting for review.", at(-1, 15), "/dashboard/importer/refunds"),
  notify("u-importer", "SUPPORT", "Support replied", "Support asked which new pickup date works for you.", at(-4, 11), "/dashboard/importer/support/tk1"),
  // Importer: David
  notify("u-importer-2", "DELIVERY", "Delivery evidence submitted", "The driver submitted proof of delivery for your Nairobi to Kigali shipment.", at(-13, 16), "/dashboard/importer/shipments/sh5"),
  notify("u-importer-2", "DISPUTE", "Dispute under review", "Your damaged cargo dispute DSP-2026-0001 is under review.", at(-11, 14), "/dashboard/importer/disputes/dc1"),
  notify("u-importer-2", "DOCUMENT", "Company document pending", "Your company registration is waiting for verification.", at(-2, 9), "/dashboard/importer/documents", true),
  // Owner: Eric
  notify("u-owner", "QUOTATION", "New cargo opportunity", "A new refrigerated request, Kampala to Kigali, is open for quotes.", at(-1, 10), "/dashboard/owner/opportunities"),
  notify("u-owner", "QUOTATION", "Quotation accepted", "Your quotation for palletised household goods to Mombasa was accepted.", at(-6, 12), "/dashboard/owner/bookings/b6", true),
  notify("u-owner", "DOCUMENT", "Inspection certificate expiring", "RAD 731K inspection certificate expires in 20 days.", at(-1, 8), "/dashboard/owner/documents"),
  notify("u-owner", "DOCUMENT", "Inspection certificate expired", "RAD 092T cannot take new work until its inspection certificate is renewed.", at(-10, 8), "/dashboard/owner/documents"),
  notify("u-owner", "INCIDENT", "Incident under investigation", "Your breakdown report INC-2026-0001 is under investigation.", at(-1, 15), "/dashboard/owner/incidents/inc1"),
  notify("u-owner", "DELIVERY", "Delivery awaiting verification", "Proof of delivery for Nairobi to Kigali is waiting for administrator verification.", at(-12, 9), "/dashboard/owner/shipments/sh5"),
  notify("u-owner", "SETTLEMENT", "Payout failed", "Payout PAY-2026-0002 failed (simulated). Update your payout destination.", at(-64, 10), "/dashboard/owner/payouts"),
  notify("u-owner", "REFUND", "Refund requested", "An importer requested a refund on RAD 418C booking b1.", at(-3, 9), "/dashboard/owner/refunds", true),
  // Owner: Amina
  notify("u-owner-2", "DOCUMENT", "Company document rejected", "Your company registration was rejected. Upload the full page and resubmit.", at(-8, 11), "/dashboard/owner/documents"),
  notify("u-owner-2", "DISPUTE", "Dispute opened against you", "David Okello opened a damaged cargo dispute on booking b3.", at(-14, 9), "/dashboard/owner/disputes/dc1"),
  notify("u-owner-2", "SETTLEMENT", "Settlement paid", "Settlement STL-2026-0003 was paid (simulated).", at(-52, 10), "/dashboard/owner/earnings", true),
  // Admin
  notify("u-admin", "DOCUMENT", "4 verification requests waiting", "Company, identity, vehicle and driver documents need review.", at(-1, 7), "/dashboard/admin/verifications"),
  notify("u-admin", "DISPUTE", "Dispute escalated", "DSP-2026-0005 was escalated for senior review.", at(-7, 9), "/dashboard/admin/disputes/dc5"),
  notify("u-admin", "SETTLEMENT", "Failed payout", "PAY-2026-0002 failed (simulated).", at(-64, 10), "/dashboard/admin/settlements", true),
  notify("u-admin", "INCIDENT", "High-severity breakdown", "INC-2026-0001 was reported near Rusumo.", at(-1, 13), "/dashboard/admin/incidents/inc1"),
  notify("u-admin", "PAYMENT", "Reconciliation discrepancy", "A payment record differs from the provider amount.", at(-2, 8), "/dashboard/admin/reconciliation"),
  notify("u-admin-fin", "SETTLEMENT", "Settlement eligible", "STL-2026-0006 is eligible for settlement.", at(-2, 8), "/dashboard/admin/settlements"),
  notify("u-admin-sup", "SUPPORT", "New support ticket", "Company verification is taking long (TKT-2026-0004).", at(-1, 16), "/dashboard/admin/support/tk4"),
  notify("u-admin-ops", "DOCUMENT", "Documents expiring", "3 driver and truck documents expire within 30 days.", at(-1, 8), "/dashboard/admin/document-expiry"),
];

export const announcements: Announcement[] = [
  { id: "an1", title: "Border queues at Gatuna and Rusumo", body: "Expect clearance delays of up to 24 hours this week. Plan pickups with extra margin.", audience: "ALL", severity: "WARNING", publishedAt: at(-2, 8), publishedBy: "u-admin-ops", expiresAt: at(5, 8) },
  { id: "an2", title: "Document reminders now start 30 days before expiry", body: "Trucks and drivers with expired documents cannot take new work. Renew early to stay eligible.", audience: "TRUCK_OWNER", severity: "INFO", publishedAt: at(-6, 9), publishedBy: "u-admin" },
  { id: "an3", title: "Demonstration environment", body: "Payments, tracking and settlements shown in this build are simulations. No money moves.", audience: "ALL", severity: "INFO", publishedAt: at(-30, 9), publishedBy: "u-admin" },
];

const audit = (n: number, when: string, actorId: string, actorName: string, action: string, entityType: string, entityRef: string, detail: string): AuditLogEntry => ({
  id: `al${n}`, at: when, actorId, actorName, action, entityType, entityRef, detail,
});

export const auditLog: AuditLogEntry[] = [
  audit(1, at(0, 8, 5), "u-admin", "Claire Mugisha", "Logged in", "Session", "u-admin", "Administrator signed in (demonstration)."),
  audit(2, at(-1, 11), "u-admin-ops", "Patrick Habiyaremye", "Rejected verification", "Verification", "VER-2026-0005", "Reason: registration certificate cropped."),
  audit(3, at(-1, 15), "u-admin-ops", "Patrick Habiyaremye", "Added incident note", "Incident", "INC-2026-0001", "Contacted the importer about a possible delay."),
  audit(4, at(-2, 8), "u-admin-fin", "Solange Uwimana", "Flagged discrepancy", "Reconciliation", "REC-2026-0006", "Recorded amount is RWF 36,000 below expected."),
  audit(5, at(-4, 10), "u-admin-sup", "Kevin Mugabo", "Replied to ticket", "Support ticket", "TKT-2026-0001", "Asked for a new pickup date."),
  audit(6, at(-7, 9), "u-admin", "Claire Mugisha", "Escalated dispute", "Dispute", "DSP-2026-0005", "Escalated for senior review."),
  audit(7, at(-9, 11), "u-admin-fin", "Solange Uwimana", "Requested information", "Dispute", "DSP-2026-0003", "Asked the importer to confirm receipt."),
  audit(8, at(-11, 14), "u-admin-sup", "Kevin Mugabo", "Added dispute note", "Dispute", "DSP-2026-0001", "Driver says crates were already opened."),
  audit(9, at(-13, 10), "u-admin-ops", "Patrick Habiyaremye", "Filed insurance claim", "Insurance claim", "CLM-2026-0001", "Claim for RWF 60,000 against JUB-KE-2026-770311."),
  audit(10, at(-20, 11), "u-admin-ops", "Patrick Habiyaremye", "Completed cancellation", "Cancellation", "CXL-2026-0002", "Cancelled before payment, no fee."),
  audit(11, at(-44, 9), "u-admin-fin", "Solange Uwimana", "Reversed settlement", "Settlement", "STL-2026-0009", "Adjusted RWF 50,000 after a dispute decision (simulated)."),
  audit(12, at(-52, 9), "u-admin-fin", "Solange Uwimana", "Started payout", "Payout", "PAY-2026-0001", "Payout started (simulated)."),
  audit(13, at(-55, 12), "u-admin", "Claire Mugisha", "Verified delivery", "Shipment", "SHP-2026-0003", "Delivery evidence verified."),
  audit(14, at(-64, 9), "u-admin-fin", "Solange Uwimana", "Started payout", "Payout", "PAY-2026-0002", "Payout started (simulated)."),
  audit(15, at(-90, 9), "u-admin", "Claire Mugisha", "Updated permissions", "Administrator", "u-admin-sup", "Support role limited to tickets, disputes and bookings."),
];

const rec = (
  n: number,
  kind: ReconciliationRecord["kind"],
  bookingId: string | undefined,
  providerRef: string,
  expected: number,
  recorded: number,
  status: ReconciliationRecord["status"],
  daysAgo: number,
  note?: string,
): ReconciliationRecord => ({ id: `rc${n}`, ref: ref("REC", n), kind, bookingId, providerRef, expectedAmountRwf: expected, recordedAmountRwf: recorded, status, date: at(-daysAgo, 12), note });

export const reconciliation: ReconciliationRecord[] = [
  rec(1, "PAYMENT", "b2", "MTN-TX-840211", 850_000, 850_000, "MATCHED", 15),
  rec(2, "PAYMENT", "b3", "AIR-TX-120394", 220_000, 220_000, "MATCHED", 16),
  rec(3, "PAYMENT", "b4", "VIS-TX-550871", 1_400_000, 1_400_000, "MATCHED", 62),
  rec(4, "PAYMENT", "b5", "MTN-TX-840877", 740_000, 740_000, "MATCHED", 17),
  rec(5, "PAYMENT", "b6", "MTN-TX-841903", 460_000, 460_000, "MATCHED", 7),
  rec(6, "PAYMENT", "booking-u-owner-5", "AIR-TX-120511", 679_000, 643_000, "DISCREPANCY", 2, "Provider recorded RWF 36,000 less than expected."),
  rec(7, "PAYMENT", undefined, "MTN-TX-842050", 0, 300_000, "UNMATCHED", 3, "Provider received a payment with no matching booking reference."),
  rec(8, "PAYMENT", "b1", "VIS-TX-551020", 850_000, 850_000, "PENDING", 1, "Awaiting provider settlement file."),
  rec(9, "PAYMENT", "b6", "MTN-TX-841904", 460_000, 460_000, "DUPLICATE", 7, "Second provider record with the same amount within 5 minutes."),
  rec(10, "REFUND", "booking-u-owner-7", "RFD-TX-300112", 0, 0, "MATCHED", 20),
  rec(11, "PAYOUT", "b4", "PAY-2026-0001", 1_316_000, 1_316_000, "MATCHED", 52),
  rec(12, "PAYOUT", "booking-u-owner-12", "PAY-2026-0002", 0, 0, "UNMATCHED", 64, "Payout failed at the provider. Nothing was transferred."),
  rec(13, "PAYOUT", "booking-u-owner-26", "PAY-2026-0003", 0, 0, "PENDING", 1, "Waiting for provider confirmation."),
  rec(14, "PAYMENT", "booking-u-owner-12", "MTN-TX-840100", 0, 0, "MATCHED", 66),
];

export const platformSettings: PlatformSettings = {
  platformFeePct: 6,
  quotationValidityDays: DEFAULT_QUOTATION_VALIDITY_DAYS,
  documentWarningDays: DEFAULT_DOCUMENT_WARNING_DAYS,
  cancellationFreeWindowHours: 24,
  maxQuotationsPerRequest: 5,
  maintenanceBanner: "",
};
