"use client";

import Link from "next/link";
import { QueryBoundary } from "@/components/common/async-state";
import { FinancialSummary, type FinancialLine } from "@/components/common/financial-summary";
import { BackLink, DetailList, Section, Timeline } from "@/components/common/layout-blocks";
import { Notice, SimulationNotice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDateTime } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { Settlement } from "@/types/ops";
import { useEligibility } from "./use-eligibility";

export function SettlementDetail({ id }: { id: string }) {
  const actor = useActor();
  const query = useServiceQuery(() => services.settlements.get(actor!, id), [actor?.id, id]);
  return (
    <div className="space-y-5">
      <BackLink href="/dashboard/owner/earnings">Earnings and settlements</BackLink>
      <QueryBoundary query={query} loadingLabel="Loading settlement">{(settlement) => <Content settlement={settlement} />}</QueryBoundary>
    </div>
  );
}

function Content({ settlement }: { settlement: Settlement }) {
  const { bookings } = useIbanga();
  const { shipments } = useOps();
  const eligibility = useEligibility();
  const booking = bookings.find((item) => item.id === settlement.bookingId);
  const shipment = settlement.shipmentId ? shipments.find((item) => item.id === settlement.shipmentId) : shipments.find((item) => item.bookingId === settlement.bookingId);
  const evaluation = eligibility(settlement);
  const lines: FinancialLine[] = [
    { label: "Agreed amount", amountRwf: settlement.agreedAmountRwf },
    { label: "Platform fee", amountRwf: settlement.platformFeeRwf, kind: "deduct" },
    ...(settlement.deductionsRwf ? [{ label: "Deductions", amountRwf: settlement.deductionsRwf, kind: "deduct" as const, hint: settlement.deductionNote }] : []),
    ...(settlement.adjustmentsRwf
      ? [{ label: "Adjustments", amountRwf: settlement.adjustmentsRwf, kind: settlement.adjustmentsRwf > 0 ? ("add" as const) : ("deduct" as const) }]
      : []),
    { label: "Net payable", amountRwf: settlement.netAmountRwf, kind: "total" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Settlement"
        title={settlement.ref}
        subtitle={booking ? `${booking.pickupLocation} to ${booking.destination}` : undefined}
        actions={<StatusBadge family="settlement" status={settlement.status} />}
      />
      <SimulationNotice kind="settlement" />
      {settlement.status === "ON_HOLD" ? (
        <Notice tone="danger" title="This settlement is on hold" action={shipment ? { href: `/dashboard/owner/shipments/${shipment.id}`, label: "Open shipment" } : undefined}>
          {settlement.holdReason ?? evaluation?.reasons[0] ?? "A dispute or incident must be resolved first."}
        </Notice>
      ) : null}
      {settlement.status === "FAILED" ? (
        <Notice tone="danger" title="The simulated payout failed" action={{ href: "/dashboard/owner/payouts", label: "Payout history" }}>
          {settlement.failureReason ?? "No reason was recorded."} Check your payout details; an administrator retries failed payouts.
        </Notice>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-2">
        <FinancialSummary title="Settlement amounts" lines={lines} footnote="Simulated figures. Net payable = agreed amount minus platform fee and deductions, plus adjustments." />
        <Section title="Eligibility">
          <div className="space-y-3">
            <p className="text-sm text-muted">Based on the booking payment, shipment, delivery verification, disputes and incidents right now:</p>
            {evaluation ? (
              <>
                <StatusBadge family="settlement" status={evaluation.status} />
                <ul className="list-disc space-y-1 pl-5 text-sm text-navy">
                  {evaluation.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted">The booking for this settlement is not available to check.</p>
            )}
          </div>
        </Section>
      </div>
      <Section title="Details">
        <DetailList
          items={[
            { label: "Payout reference", value: settlement.payoutRef ?? "Not yet created" },
            { label: "Processed", value: formatDateTime(settlement.processedAt) },
            { label: "Paid (simulated)", value: formatDateTime(settlement.paidAt) },
            { label: "Created", value: formatDateTime(settlement.createdAt) },
            {
              label: "Linked records",
              wide: true,
              value: (
                <span className="flex flex-wrap gap-4 text-sm">
                  {booking ? <Link className="text-brand hover:underline" href={`/dashboard/owner/bookings/${booking.id}`}>Booking</Link> : null}
                  {shipment ? <Link className="text-brand hover:underline" href={`/dashboard/owner/shipments/${shipment.id}`}>Shipment {shipment.ref}</Link> : null}
                  {settlement.payoutId ? <Link className="text-brand hover:underline" href="/dashboard/owner/payouts">Payout history</Link> : null}
                </span>
              ),
            },
          ]}
        />
      </Section>
      <Section title="Status history">
        <Timeline
          empty="No status changes recorded."
          entries={[...settlement.history].reverse().map((entry, index) => ({
            id: `${entry.at}-${index}`,
            title: `${entry.status.replaceAll("_", " ").toLowerCase()} (${entry.actor})`,
            detail: entry.note,
            at: formatDateTime(entry.at),
            tone: entry.status === "FAILED" || entry.status === "ON_HOLD" ? "danger" : entry.status === "PAID" ? "success" : "brand",
          }))}
        />
      </Section>
    </>
  );
}
