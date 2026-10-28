"use client";

import Link from "next/link";
import { ConfirmButton } from "@/components/common/confirm-button";
import { FinancialSummary } from "@/components/common/financial-summary";
import { BackLink, DetailList, Section, Timeline, type TimelineEntry } from "@/components/common/layout-blocks";
import { Notice, SimulationNotice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/ui";
import { useState } from "react";
import { controlClass, FormField } from "@/components/common/form-fields";
import { settlementSummary } from "@/features/admin-cases/settle-payment";
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

  const heldRwf = payment && ["FUNDED", "HELD"].includes(payment.status) ? payment.amountRwf : 0;
  const [amount, setAmount] = useState(String(Math.min(refund.amountRwf, heldRwf || refund.amountRwf)));
  const [approveNote, setApproveNote] = useState("");
  const approveRwf = Number(amount);
  const amountValid = Number.isInteger(approveRwf) && approveRwf >= 1 && approveRwf <= heldRwf;

  // processRefund reports problems as a returned message; throw it so useAction shows the toast.
  const decide = (decision: "APPROVED" | "REJECTED", note: string, success: string, amountRwf?: number) =>
    run(
      async () => {
        const problem = await processRefund(refund.id, decision, note, amountRwf);
        if (problem) throw new Error(problem);
        return true;
      },
      { success },
    );

  const history: TimelineEntry[] = [
    { id: "req", title: `Requested by ${nameOf(refund.importerId)}`, detail: refund.reason, at: formatDateTime(refund.createdAt), tone: "brand" },
  ];
  if (refund.ownerRespondedAt) {
    history.push({ id: "own", title: "Truck owner responded", detail: refund.ownerNote, at: formatDateTime(refund.ownerRespondedAt), tone: "brand" });
  }
  if (refund.resolvedAt) {
    history.push({
      id: "dec",
      title: refund.status === "APPROVED" ? `Approved: ${formatRwf(refund.approvedAmountRwf ?? refund.amountRwf)} refunded` : "Rejected",
      detail: refund.decisionNote || undefined,
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

          <Section title="Truck owner's side" description="The owner can respond but cannot decide.">
            {refund.ownerNote ? (
              <p className="whitespace-pre-line text-sm leading-6 text-navy">{refund.ownerNote}</p>
            ) : (
              <p className="text-sm text-muted">The truck owner has not responded yet.</p>
            )}
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

        <Section title="Decision" description={pending ? "Approving refunds the money held in escrow straight to the importer's iBanga wallet." : "This request has been decided."}>
          {!pending ? (
            <Notice tone={refund.status === "APPROVED" ? "success" : "info"} title={refund.status === "APPROVED" ? `Approved: ${formatRwf(refund.approvedAmountRwf ?? refund.amountRwf)} refunded` : "Rejected"}>
              {refund.decisionNote || "No reason was recorded."}
            </Notice>
          ) : canAct && !heldRwf ? (
            <Notice tone="warning" title="No payment is held for this booking">
              The money has already left escrow, so it cannot be refunded from here. Reject the request with an explanation.
            </Notice>
          ) : canAct ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <FormField label="Amount to refund (RWF)" required hint={`Requested ${formatRwf(refund.amountRwf)}. Held in escrow: ${formatRwf(heldRwf)}. Anything not refunded is paid to the truck owner.`} error={amount && !amountValid ? `Enter a whole amount from 1 to ${heldRwf}.` : undefined}>
                  <input type="number" min={1} max={heldRwf} className={controlClass} value={amount} onChange={(event) => setAmount(event.target.value)} />
                </FormField>
                <FormField label="Reason for approving" required hint="Shown to the importer and the truck owner.">
                  <textarea className={`${controlClass} min-h-20 resize-y`} value={approveNote} onChange={(event) => setApproveNote(event.target.value)} placeholder="For example: the owner did not deliver the cargo." />
                </FormField>
                <ConfirmButton
                  label="Approve and refund"
                  title="Approve this refund?"
                  message="Money moves from escrow straight away. This cannot be undone."
                  summary={payment && amountValid ? settlementSummary(payment, approveRwf) : undefined}
                  disabled={busy || !amountValid || approveNote.trim().length < 5}
                  onConfirm={() => decide("APPROVED", approveNote.trim(), "Refund approved and sent to the importer's wallet.", approveRwf)}
                />
              </div>
              <div className="border-t border-line pt-5">
                <NoteAction
                  fieldLabel="Reason for rejecting"
                  placeholder="Tell the importer why this request cannot be refunded"
                  errorMessage="Give the reason for rejecting (at least 5 characters)."
                  label="Reject refund"
                  title="Reject this refund request?"
                  message="The importer sees your reason. No refund is made, and the dispute stays open so you can still decide the payment from the booking."
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
