"use client";

import Link from "next/link";
import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { ConfirmButton } from "@/components/common/confirm-button";
import { controlClass, FormField } from "@/components/common/form-fields";
import { FinancialSummary } from "@/components/common/financial-summary";
import { BackLink, DetailList, Section, Timeline } from "@/components/common/layout-blocks";
import { Notice, SimulationNotice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { CANCELLATION_POLICY } from "@/config/business-rules";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDateTime, formatRwf } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services, type Actor } from "@/services";
import type { CancellationRequest } from "@/types/ops";
import { stageLabel } from "./cancellations-list";
import { NoPermissionNotice, useUserName } from "./finance-parts";
import { noteSchema } from "./schemas";
import { useAdminPermission } from "./use-admin-permission";

export function CancellationDetail({ id }: { id: string }) {
  const actor = useActor();
  const query = useServiceQuery(async () => {
    const all = await services.cancellations.list(actor!, { pageSize: 500 });
    return all.items.find((item) => item.id === id) ?? null;
  }, [actor?.id, id]);
  return (
    <div className="mt-4 space-y-5">
      <BackLink href="/dashboard/admin/cancellations">All cancellations</BackLink>
      <QueryBoundary
        query={query}
        isEmpty={(request) => request === null}
        empty={{ title: "Cancellation not found", text: "This request does not exist or was removed." }}
      >
        {(request) => (request && actor ? <CancellationBody request={request} actor={actor} /> : null)}
      </QueryBoundary>
    </div>
  );
}

function CancellationBody({ request, actor }: { request: CancellationRequest; actor: Actor }) {
  const { bookings, patchBooking } = useIbanga();
  const nameOf = useUserName();
  const canAct = useAdminPermission("refunds");
  const { run, busy } = useAction();
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);

  const booking = bookings.find((item) => item.id === request.bookingId);
  const payment = booking?.payment;
  const policy = CANCELLATION_POLICY.find((row) => row.stage === request.stage);
  const noteCheck = noteSchema("Add a note for the requester (at least 5 characters).").safeParse(note);
  const noteError = touched && !noteCheck.success ? noteCheck.error.issues[0]?.message : undefined;
  // A paid booking must also be refunded in the marketplace data; one cancelled before payment only changes status.
  const refundsPayment = Boolean(payment) && request.stage !== "BEFORE_PAYMENT" && payment?.status !== "REFUNDED";

  const review = (approve: boolean) =>
    run(
      async () => {
        await services.cancellations.review(actor, request.id, { approve, note: note.trim() });
        setNote("");
        setTouched(false);
        return true;
      },
      { success: approve ? "Cancellation approved." : "Cancellation rejected." },
    );

  const complete = () =>
    run(
      async () => {
        await services.cancellations.complete(actor, request.id);
        if (refundsPayment && payment) {
          const problem = await patchBooking(request.bookingId, {
            status: "REJECTED",
            payment: { ...payment, status: "REFUNDED", refundedAt: new Date().toISOString() },
          });
          if (problem) throw new Error(`The cancellation was completed but the booking could not be updated: ${problem}`);
        }
        return true;
      },
      { success: refundsPayment ? "Cancellation completed. The payment is marked refunded." : "Cancellation completed." },
    );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-sm font-semibold text-brand">Cancellation request</p>
          <h1 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">{request.ref}</h1>
          <p className="mt-1.5 text-base text-muted">{nameOf(request.requestedBy)} · booking <span className="font-mono text-sm">{request.bookingId}</span></p>
        </div>
        <StatusBadge family="cancellation" status={request.status} />
      </div>

      <SimulationNotice kind="payment" />
      {!canAct ? <NoPermissionNotice area="refund and cancellation permissions" /> : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,1fr)]">
        <div className="space-y-5">
          <Section title="Request">
            <DetailList
              items={[
                { label: "Requested by", value: `${nameOf(request.requestedBy)} (${request.requesterRole.replaceAll("_", " ").toLowerCase()})` },
                { label: "Requested on", value: formatDateTime(request.createdAt) },
                { label: "Reason", value: request.reason },
                { label: "Stage", value: stageLabel(request.stage) },
                { label: "Details", value: request.details || "—", wide: true },
              ]}
            />
          </Section>

          <Section title="Policy outcome" description={policy?.summary}>
            <FinancialSummary
              lines={[
                { label: "Amount paid", amountRwf: request.paidAmountRwf },
                { label: `Cancellation fee (${Math.round((policy?.feeRate ?? 0) * 100)}%)`, amountRwf: request.feeRwf, kind: "deduct" },
                { label: "Refundable amount", amountRwf: request.refundRwf, kind: "total" },
              ]}
              footnote="Calculated from the cancellation policy."
            />
          </Section>

          <Section title="Booking and payment">
            {booking ? (
              <div className="space-y-3">
                <DetailList
                  items={[
                    { label: "Route", value: `${booking.pickupLocation} to ${booking.destination}` },
                    { label: "Booking status", value: <StatusBadge family="booking" status={booking.status} /> },
                    { label: "Payment", value: payment ? <StatusBadge family="payment" status={payment.status} /> : "No payment taken" },
                    { label: "Receipt number", value: payment?.receiptNumber ?? "—" },
                  ]}
                />
                <Link href={`/dashboard/admin/bookings/${booking.id}`} className="inline-block text-sm font-semibold text-brand hover:text-brand-dark">View booking</Link>
              </div>
            ) : (
              <Notice tone="warning" title="Booking not found">The booking is not in the marketplace data, so the payment cannot be updated.</Notice>
            )}
          </Section>

          <Section title="History">
            <Timeline
              entries={[
                { id: "req", title: `Requested by ${nameOf(request.requestedBy)}`, detail: request.reason, at: formatDateTime(request.createdAt), tone: "brand" },
                ...(request.reviewedBy
                  ? [{ id: "rev", title: request.status === "REJECTED" ? "Rejected" : "Approved", detail: request.reviewNote, tone: request.status === "REJECTED" ? ("danger" as const) : ("success" as const) }]
                  : []),
                ...(request.status === "COMPLETED" && request.resolvedAt
                  ? [{ id: "done", title: "Completed", at: formatDateTime(request.resolvedAt), tone: "success" as const, simulated: true }]
                  : []),
              ]}
            />
          </Section>
        </div>

        <Section title="Decision" description="Approve or reject first, then complete an approved request.">
          {!canAct ? (
            <p className="text-sm text-muted">Decisions are unavailable for your role.</p>
          ) : request.status === "REQUESTED" ? (
            <div className="space-y-4">
              <FormField label="Note for the requester" error={noteError} required>
                <textarea rows={3} value={note} aria-invalid={Boolean(noteError)} disabled={busy} onChange={(event) => setNote(event.target.value)} onBlur={() => setTouched(true)} className={controlClass} />
              </FormField>
              <div className="flex flex-wrap gap-3">
                <ConfirmButton
                  label="Approve"
                  title="Approve this cancellation?"
                  message="The booking stays open until you complete the cancellation."
                  summary={[`Fee ${formatRwf(request.feeRwf)}, refundable ${formatRwf(request.refundRwf)}`, `Note: ${note.trim()}`]}
                  disabled={busy || !noteCheck.success}
                  onConfirm={() => review(true)}
                />
                <ConfirmButton
                  label="Reject"
                  title="Reject this cancellation?"
                  message="The booking continues and the requester sees your note."
                  summary={[`Note: ${note.trim()}`]}
                  variant="ghost"
                  tone="danger"
                  disabled={busy || !noteCheck.success}
                  onConfirm={() => review(false)}
                />
              </div>
            </div>
          ) : request.status === "APPROVED" ? (
            <div className="space-y-4">
              {request.reviewNote ? <Notice tone="info" title="Approval note">{request.reviewNote}</Notice> : null}
              <ConfirmButton
                label="Complete cancellation"
                title={refundsPayment ? "Complete and record refund?" : "Complete this cancellation?"}
                message={refundsPayment ? "This cancels the booking and marks its payment as refunded." : "This closes the request. No payment was taken, so nothing is refunded."}
                summary={
                  refundsPayment
                    ? [
                        `Refund amount: ${formatRwf(request.refundRwf)} (fee ${formatRwf(request.feeRwf)} kept)`,
                        "Booking status becomes Cancelled and the payment becomes Refunded.",
                        "",
                      ]
                    : ["Booking status is not changed by this step.", "No payment was taken, so no refund is recorded."]
                }
                disabled={busy}
                onConfirm={complete}
              />
            </div>
          ) : (
            <Notice tone={request.status === "COMPLETED" ? "success" : "info"} title={request.status === "COMPLETED" ? "Completed" : "Rejected"}>
              {request.reviewNote || "No note was recorded."}
            </Notice>
          )}
        </Section>
      </div>
    </>
  );
}
