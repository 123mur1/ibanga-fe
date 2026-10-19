"use client";

import Link from "next/link";
import { QueryBoundary } from "@/components/common/async-state";
import { FinancialSummary, type FinancialLine } from "@/components/common/financial-summary";
import { BackLink, DetailList, Section, Timeline } from "@/components/common/layout-blocks";
import { Notice, SimulationNotice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { evaluateSettlement } from "@/config/business-rules";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDateTime, formatRwf } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { Settlement, SettlementStatus } from "@/types/ops";
import { NoPermissionNotice, useUserName } from "./finance-parts";
import { SettlementActions } from "./settlement-actions";
import { useAdminPermission } from "./use-admin-permission";

const HISTORY_TONE: Partial<Record<SettlementStatus, "success" | "danger" | "warning" | "brand">> = {
  PAID: "success",
  FAILED: "danger",
  ON_HOLD: "danger",
  REVERSED: "warning",
  PROCESSING: "brand",
};

export function SettlementDetail({ id }: { id: string }) {
  const actor = useActor();
  const query = useServiceQuery(() => services.settlements.get(actor!, id), [actor?.id, id]);
  return (
    <div className="mt-4 space-y-5">
      <BackLink href="/dashboard/admin/settlements">All settlements</BackLink>
      <QueryBoundary query={query} loadingLabel="Loading settlement">
        {(settlement) => <SettlementBody settlement={settlement} />}
      </QueryBoundary>
    </div>
  );
}

function SettlementBody({ settlement }: { settlement: Settlement }) {
  const actor = useActor();
  const ops = useOps();
  const { bookings } = useIbanga();
  const nameOf = useUserName();
  const canAct = useAdminPermission("settlements");

  const booking = bookings.find((item) => item.id === settlement.bookingId);
  const shipment = ops.shipments.find((item) => item.id === settlement.shipmentId) ?? ops.shipments.find((item) => item.bookingId === settlement.bookingId);
  const dispute = ops.disputeCases.find((item) => item.bookingId === settlement.bookingId && !["RESOLVED", "REJECTED"].includes(item.status));
  const incident = shipment ? ops.incidents.find((item) => item.shipmentId === shipment.id && !["RESOLVED", "CLOSED"].includes(item.status)) : undefined;
  const evaluation = booking ? evaluateSettlement({ booking, shipment, openDispute: Boolean(dispute), openIncident: Boolean(incident) }) : null;
  const evidence = shipment?.evidence;
  const mismatch = evaluation && !["PROCESSING", "PAID", "FAILED", "REVERSED"].includes(settlement.status) && evaluation.status !== settlement.status;

  const adjustment = settlement.adjustmentsRwf;
  const lines: FinancialLine[] = [
    { label: "Agreed amount", amountRwf: settlement.agreedAmountRwf },
    { label: "Platform fee", amountRwf: settlement.platformFeeRwf, kind: "deduct" },
    { label: "Approved deductions", amountRwf: settlement.deductionsRwf, kind: "deduct", hint: settlement.deductionNote },
    { label: "Adjustments", amountRwf: adjustment, kind: adjustment < 0 ? "deduct" : "add" },
    { label: "Net payout to owner", amountRwf: settlement.netAmountRwf, kind: "total" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-sm font-semibold text-brand">Settlement</p>
          <h1 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">{settlement.ref}</h1>
          <p className="mt-1.5 text-base text-muted">
            {nameOf(settlement.ownerId)} · booking <span className="font-mono text-sm">{settlement.bookingId}</span>
            {settlement.payoutRef ? ` · payout ${settlement.payoutRef}` : ""}
          </p>
        </div>
        <StatusBadge family="settlement" status={settlement.status} />
      </div>

      <SimulationNotice kind="settlement" />
      {!canAct ? <NoPermissionNotice area="settlement permissions" /> : null}
      {settlement.holdReason ? <Notice tone="danger" title="Settlement hold">{settlement.holdReason}</Notice> : null}
      {mismatch ? (
        <Notice tone="warning" title="Stored status differs from the live check">
          The record says {settlement.status.replaceAll("_", " ").toLowerCase()} but the live evaluation says {evaluation.status.replaceAll("_", " ").toLowerCase()}. Approval always uses the live evaluation.
        </Notice>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,1fr)]">
        <div className="space-y-5">
          <Section title="Financial summary" description="All amounts are simulated Rwandan francs.">
            <FinancialSummary lines={lines} footnote="Net payout = agreed amount − platform fee − deductions + adjustments, never below zero." />
          </Section>

          <Section title="Eligibility (live check)" description="Evaluated now from the booking, shipment, dispute and incident records.">
            {evaluation ? (
              <div className="space-y-3">
                <StatusBadge family="settlement" status={evaluation.status} />
                <ul className="list-disc space-y-1 pl-5 text-sm text-navy">
                  {evaluation.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <Notice tone="warning" title="Booking not found">The booking for this settlement is not in the marketplace data, so eligibility cannot be evaluated and approval is blocked.</Notice>
            )}
            <div className="mt-5">
              <DetailList
                items={[
                  { label: "Payment", value: booking?.payment ? <StatusBadge family="payment" status={booking.payment.status} /> : "No payment" },
                  { label: "Shipment", value: shipment ? <StatusBadge family="shipment" status={shipment.status} /> : "No shipment" },
                  { label: "Delivery verification", value: evidence ? <StatusBadge family="evidence" status={evidence.verification} /> : "No evidence submitted" },
                  { label: "Open dispute", value: dispute ? <><StatusBadge family="dispute" status={dispute.status} /> <Link href={`/dashboard/admin/disputes/${dispute.id}`} className="ml-2 text-sm text-brand underline">{dispute.ref}</Link></> : "None" },
                  { label: "Unresolved incident", value: incident ? <><StatusBadge family="incident" status={incident.status} /> <Link href={`/dashboard/admin/incidents/${incident.id}`} className="ml-2 text-sm text-brand underline">{incident.ref}</Link></> : "None" },
                  { label: "Administrator hold", value: settlement.holdReason?.startsWith("Admin hold") ? "Yes" : "No" },
                ]}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-brand">
              <Link href={`/dashboard/admin/bookings/${settlement.bookingId}`} className="hover:text-brand-dark">View booking</Link>
              {shipment ? <Link href={`/dashboard/admin/shipments/${shipment.id}`} className="hover:text-brand-dark">View shipment</Link> : null}
            </div>
          </Section>

          <Section title="Status history">
            <Timeline
              empty="No history recorded."
              entries={[...settlement.history].reverse().map((entry, index) => ({
                id: `${entry.at}-${index}`,
                title: `${entry.status.replaceAll("_", " ").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase())} · ${entry.actor}`,
                detail: entry.note,
                at: formatDateTime(entry.at),
                tone: HISTORY_TONE[entry.status] ?? "neutral",
              }))}
            />
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Administrator actions" description="Each action asks for confirmation and is recorded in the audit log.">
            {actor ? <SettlementActions settlement={settlement} evaluation={evaluation} actor={actor} canAct={canAct} /> : null}
            {!canAct ? <p className="text-sm text-muted">Actions are unavailable for your role.</p> : null}
          </Section>
          <Section title="Record">
            <DetailList
              columns={1}
              items={[
                { label: "Created", value: formatDateTime(settlement.createdAt) },
                { label: "Payout started", value: settlement.processedAt ? formatDateTime(settlement.processedAt) : "—" },
                { label: "Paid (simulated)", value: settlement.paidAt ? formatDateTime(settlement.paidAt) : "—" },
                { label: "Net payout", value: formatRwf(settlement.netAmountRwf) },
              ]}
            />
          </Section>
        </div>
      </div>
    </>
  );
}
