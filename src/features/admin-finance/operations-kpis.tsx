"use client";

import { DemoTag } from "@/components/common/notices";
import { effectiveDocumentStatus, expiryState } from "@/config/business-rules";
import { StatCard } from "@/components/ui";
import { useOps } from "@/hooks/use-ops";
import { useIbanga } from "@/lib/store";

const BASE = "/dashboard/admin";

/** Operations KPI row for the administrator overview. Counts come from the demonstration dataset. */
export function OperationsKpis() {
  const ops = useOps();
  const { refunds } = useIbanga();
  const warningDays = ops.settings.documentWarningDays;

  const pendingVerifications = ops.verificationRequests.filter((item) => item.status === "PENDING").length;
  const activeShipments = ops.shipments.filter((item) => !["DELIVERED", "COMPLETED", "CANCELLED"].includes(item.status)).length;
  const pendingSettlements = ops.settlements.filter((item) => ["ELIGIBLE", "AWAITING_VERIFICATION"].includes(item.status)).length;
  const openDisputes = ops.disputeCases.filter((item) => !["RESOLVED", "REJECTED"].includes(item.status)).length;
  const openIncidents = ops.incidents.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status)).length;
  const documentAlerts = ops.documents.filter((doc) => effectiveDocumentStatus(doc) === "EXPIRED" || (doc.status === "APPROVED" && expiryState(doc.expiryDate, warningDays) === "EXPIRING")).length;
  const failedMoney = ops.payouts.filter((item) => item.status === "FAILED").length + refunds.filter((item) => item.payoutState === "FAILED").length;
  const discrepancies = ops.reconciliation.filter((item) => item.status === "DISCREPANCY").length;

  const cards = [
    { label: "Pending verifications", value: pendingVerifications, href: `${BASE}/verifications`, accent: "warn" },
    { label: "Active shipments", value: activeShipments, href: `${BASE}/shipments`, accent: "brand" },
    { label: "Pending settlements", value: pendingSettlements, href: `${BASE}/settlements`, accent: "accent" },
    { label: "Open disputes", value: openDisputes, href: `${BASE}/disputes`, accent: "bad" },
    { label: "Open incidents", value: openIncidents, href: `${BASE}/incidents`, accent: "bad" },
    { label: "Document expiry alerts", value: documentAlerts, href: `${BASE}/document-expiry`, accent: "warn" },
    { label: "Failed payouts and refunds", value: failedMoney, href: `${BASE}/settlements`, accent: "bad" },
    { label: "Reconciliation discrepancies", value: discrepancies, href: `${BASE}/reconciliation`, accent: "warn" },
  ] as const;

  return (
    <section aria-labelledby="ops-kpis-heading" className="mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="ops-kpis-heading" className="text-lg font-semibold text-navy">Operations at a glance</h2>
        <DemoTag />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} hint={card.value === 0 ? "Nothing to review" : "Needs attention"} accent={card.value === 0 ? "good" : card.accent} href={card.href} />
        ))}
      </div>
    </section>
  );
}
