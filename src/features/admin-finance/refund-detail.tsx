"use client";

import Link from "next/link";
import { ConfirmButton } from "@/components/common/confirm-button";
import { FinancialSummary } from "@/components/common/financial-summary";
import { BackLink, DetailList, Section, Timeline, type TimelineEntry } from "@/components/common/layout-blocks";
import { Notice, SimulationNotice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { formatDateTime, formatRwf } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import type { RefundRequest } from "@/lib/types";
import { NoPermissionNotice, NoteAction, useUserName } from "./finance-parts";
import { SOURCE_LABEL } from "./refunds-list";
import { useAdminPermission } from "./use-admin-permission";

export function RefundDetail({ id }: { id: string }) {
  const { refunds } = useIbanga();
  const refund = refunds.find((item) => item.id === id);
  return (
    <div className="mt-4 space-y-5">
      <BackLink href="/dashboard/admin/refunds">All refunds</BackLink>
      {refund ? <RefundBody refund={refund} /> : <EmptyState title="Refund not found" text="This refund request does not exist or was removed." />}
    </div>
  );
}

function RefundBody({ refund }: { refund: RefundRequest }) {
  const { bookings, trucks, processRefund } = useIbanga();
  const nameOf = useUserName();
  const canAct = useAdminPermission("refunds");
  const { run, busy } = useAction();
  const booking = bookings.find((item) => item.id === refund.bookingId);
  const payment = booking?.payment;
  const truck = trucks.find((item) => item.id === booking?.truckId);
  const reference = refund.ref ?? refund.id;
  const pending = refund.status === "REQUESTED";
  const state = refund.payoutState;

  // processRefund reports problems as a returned message; throw it so useAction shows the toast.
  const decide = (decision: "APPROVED" | "REJECTED", note: string, success: string) =>
    run(
      async () => {
        const problem = await processRefund(refund.id, decision, note);
        if (problem) throw new Error(problem);
        return true;
      },
      { success },
    );

  const history: TimelineEntry[] = [
    { id: "req", title: `Requested by ${nameOf(refund.importerId)}`, detail: refund.reason, at: formatDateTime(refund.createdAt), tone: "brand" },
  ];
  if (refund.resolvedAt) {
    history.push({
      id: "dec",
      title: refund.status === "APPROVED" ? "Approved" : "Rejected",
      detail: refund.ownerNote || undefined,
      at: formatDateTime(refund.resolvedAt),
      tone: refund.status === "APPROVED" ? "success" : "danger",
    });
  }
  if (state) {
    history.push({
      id: "pay",
      title: state === "COMPLETED" ? "Refund sent" : state === "FAILED" ? "Refund failed" : "Refund pending",
      detail: refund.failureReason,
      tone: state === "COMPLETED" ? "success" : state === "FAILED" ? "danger" : "warning",
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-sm font-semibold text-brand">Refund request</p>
          <h1 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">{reference}</h1>
          <p className="mt-1.5 text-base text-muted">
            {nameOf(refund.importerId)} · {formatRwf(refund.amountRwf)} · {SOURCE_LABEL[refund.source ?? "REFUND"]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge family="refund" status={refund.status} />
          {state ? (
            <StatusBadge
              family="refund"
              status={refund.status}
              label={state === "FAILED" ? "Refund failed" : state === "COMPLETED" ? "Refund sent" : "Refund pending"}
              tone={state === "FAILED" ? "danger" : state === "COMPLETED" ? "success" : "warning"}
            />
          ) : null}
        </div>
      </div>

      <SimulationNotice kind="payment" />
      {!canAct ? <NoPermissionNotice area="refund permissions" /> : null}
      {state === "FAILED" ? <Notice tone="danger" title="Refund failed">{refund.failureReason ?? "No reason was recorded."}</Notice> : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,1fr)]">
        <div className="space-y-5">
          <Section title="Request">
            <DetailList
              items={[
                { label: "Reason", value: refund.reason },
                { label: "Amount requested", value: formatRwf(refund.amountRwf) },
                { label: "Refund to", value: refund.refundTo },
                { label: "Requested on", value: formatDateTime(refund.createdAt) },
                { label: "Details", value: refund.details || "—", wide: true },
              ]}
            />
          </Section>

          <Section title="Booking and payment">
            {booking ? (
              <div className="space-y-4">
                <DetailList
                  items={[
                    { label: "Route", value: `${booking.pickupLocation} to ${booking.destination}` },
                    { label: "Cargo", value: `${booking.cargoType} · ${booking.cargoWeight}` },
                    { label: "Truck", value: truck ? `${truck.plateNumber} · ${truck.truckType}` : "—" },
                    { label: "Booking status", value: <StatusBadge family="booking" status={booking.status} /> },
                    { label: "Payment status", value: payment ? <StatusBadge family="payment" status={payment.status} /> : "No payment" },
                    { label: "Receipt number", value: payment?.receiptNumber ?? "—" },
                  ]}
                />
                {payment ? (
                  <FinancialSummary
                    title="Payment on record"
                    lines={[
                      { label: "Amount paid", amountRwf: payment.amountRwf },
                      { label: "Platform fee", amountRwf: payment.commissionRwf, kind: "deduct" },
                      { label: "Owner share", amountRwf: payment.ownerAmountRwf, kind: "total" },
                    ]}
                  />
                ) : null}
                <div className="flex flex-wrap gap-4 text-sm font-semibold text-brand">
                  <Link href={`/dashboard/admin/bookings/${booking.id}`} className="hover:text-brand-dark">View booking</Link>
                  {payment ? <Link href={`/dashboard/admin/payments/${booking.id}`} className="hover:text-brand-dark">View payment</Link> : null}
                </div>
              </div>
            ) : (
              <Notice tone="warning" title="Booking not found">The booking behind this refund is not in the marketplace data.</Notice>
            )}
          </Section>

          <Section title="References and history">
            <DetailList
              items={[
                { label: "Refund reference", value: reference },
                { label: "Booking reference", value: refund.bookingId },
                { label: "Payment receipt", value: payment?.receiptNumber ?? "—" },
                { label: "Origin", value: SOURCE_LABEL[refund.source ?? "REFUND"] },
              ]}
            />
            <div className="mt-5">
              <Timeline entries={history} />
            </div>
          </Section>
        </div>

        <Section title="Decision" description={pending ? "Approving marks the payment as refunded." : "This request has been decided."}>
          {!pending ? (
            <Notice tone={refund.status === "APPROVED" ? "success" : "info"} title={refund.status === "APPROVED" ? "Approved" : "Rejected"}>
              {refund.ownerNote || "No note was recorded."}
            </Notice>
          ) : canAct ? (
            <div className="space-y-6">
              <ConfirmButton
                label="Approve refund"
                title="Approve this refund?"
                message="The importer's payment will be marked as refunded."
                summary={[
                  `Refund ${formatRwf(refund.amountRwf)} to ${refund.refundTo}`,
                  "A booking that has not started is cancelled and its truck becomes available again.",
                ]}
                disabled={busy}
                onConfirm={() => decide("APPROVED", "Approved by an administrator.", "Refund approved.")}
              />
              <div className="border-t border-line pt-5">
                <NoteAction
                  fieldLabel="Reason for rejecting"
                  placeholder="Tell the importer why this request cannot be refunded"
                  errorMessage="Give the reason for rejecting (at least 5 characters)."
                  label="Reject refund"
                  title="Reject this refund request?"
                  message="The importer sees your reason and no refund is made."
                  variant="ghost"
                  tone="danger"
                  disabled={busy}
                  summary={(note) => [`Reason: ${note}`]}
                  onConfirm={(note) => decide("REJECTED", note, "Refund request rejected.")}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Decisions are unavailable for your role.</p>
          )}
        </Section>
      </div>
    </>
  );
}
