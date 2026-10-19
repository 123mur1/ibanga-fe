"use client";

import { useRouter } from "next/navigation";
import { ConfirmButton } from "@/components/common/confirm-button";
import { FinancialSummary } from "@/components/common/financial-summary";
import { controlClass, FormField } from "@/components/common/form-fields";
import { Section } from "@/components/common/layout-blocks";
import { Notice, SimulationNotice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { CANCELLATION_POLICY, calculateCancellation, cancellationStageFor } from "@/config/business-rules";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { formatDate, formatRwf } from "@/lib/format";
import { applyFieldErrors, useZodForm } from "@/lib/forms";
import { services } from "@/services";
import type { Booking } from "@/lib/types";
import type { CancellationRequest, Shipment } from "@/types/ops";
import { LinkButton } from "./link-button";
import { CANCEL_REASONS, cancelBookingSchema } from "./schemas";

const PAID = ["FUNDED", "HELD", "AUTHORIZED"];

const BLOCKED: Record<string, string> = {
  DELIVERED: "The cargo has been delivered. Confirm receipt, or report a problem if something is wrong.",
  DISPUTED: "A dispute is open. It must be resolved before the booking can change.",
  COMPLETED: "This booking is complete.",
  REJECTED: "This booking is already cancelled.",
};

function PolicyTable({ current }: { current?: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[28rem] text-left text-sm">
        <thead className="bg-background text-muted">
          <tr><th className="px-4 py-3 font-semibold">When you cancel</th><th className="px-4 py-3 font-semibold">Fee</th><th className="px-4 py-3 font-semibold">What happens</th></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {CANCELLATION_POLICY.map((row) => (
            <tr key={row.stage} className={row.stage === current ? "bg-brand-soft/50" : ""}>
              <td className="px-4 py-3 font-semibold text-navy">{row.label}{row.stage === current ? <span className="ml-2 text-xs font-semibold text-brand">Applies to you</span> : null}</td>
              <td className="px-4 py-3 tabular-nums">{row.feeRate * 100}%</td>
              <td className="px-4 py-3 text-muted">{row.summary}</td>
            </tr>
          ))}
          <tr><td className="px-4 py-3 font-semibold text-navy">After delivery or during a dispute</td><td className="px-4 py-3">n/a</td><td className="px-4 py-3 text-muted">Cannot be cancelled. Confirm receipt or report a problem.</td></tr>
        </tbody>
      </table>
    </div>
  );
}

/** Cancellation outcome and request form for one booking (the importer's own). */
export function CancelBookingPanel({ booking, shipment, existing }: { booking: Booking; shipment?: Shipment; existing?: CancellationRequest }) {
  const router = useRouter();
  const actor = useActor();
  const { run, busy } = useAction();
  const stage = cancellationStageFor(booking, shipment);
  const paid = booking.payment && PAID.includes(booking.payment.status) ? booking.payment.amountRwf : 0;
  const outcome = stage ? calculateCancellation(stage, paid) : null;
  const form = useZodForm(cancelBookingSchema, { mode: "onChange", defaultValues: { reason: "", details: "" } });
  const { register, handleSubmit, setError, formState } = form;

  const submit = handleSubmit(async (values) => {
    if (!actor || !stage || !outcome) return;
    const created = await run(
      () => services.cancellations.request(actor, { bookingId: booking.id, stage, paidAmountRwf: outcome.paidAmountRwf, reason: values.reason, details: values.details }),
      {
        success: "Cancellation requested. An administrator will review it.",
        onError: (_error, fields) => applyFieldErrors(setError, fields),
      },
    );
    if (created) router.push(`/dashboard/importer/bookings/${booking.id}`);
  });

  const route = `${booking.pickupLocation} to ${booking.destination}`;

  return (
    <div className="space-y-5">
      <Section title="Booking" actions={<StatusBadge family="booking" status={booking.status} />}>
        <p className="font-semibold text-navy">{route}</p>
        <p className="text-sm text-muted">{booking.cargoType} · {booking.cargoWeight} · pickup {formatDate(booking.pickupDate)} · {booking.agreedPrice}</p>
      </Section>

      <Section title="Cancellation policy"><PolicyTable current={stage ?? undefined} /></Section>

      {existing && ["REQUESTED", "APPROVED"].includes(existing.status) ? (
        <Section title="Cancellation already requested" actions={<StatusBadge family="cancellation" status={existing.status} />}>
          <div className="space-y-4">
            <Notice tone="info" title={`Request ${existing.ref}`}>
              You asked to cancel on {formatDate(existing.createdAt)}: {existing.reason}. {existing.status === "REQUESTED" ? "It is waiting for an administrator, so you cannot send another." : "It was approved and is being completed."}
            </Notice>
            <FinancialSummary title="Outcome of this request" lines={[
              { label: "Amount paid", amountRwf: existing.paidAmountRwf },
              { label: "Cancellation fee", amountRwf: existing.feeRwf, kind: "deduct" },
              { label: "Refundable amount", amountRwf: existing.refundRwf, kind: "total" },
            ]} />
          </div>
        </Section>
      ) : !stage || !outcome ? (
        <Notice tone="warning" title="This booking cannot be cancelled">
          {BLOCKED[booking.status] ?? "It is no longer in a state that can be cancelled."}
          <span className="mt-2 flex flex-wrap gap-3">
            <LinkButton href={`/dashboard/importer/disputes/new?booking=${booking.id}`} variant="ghost">Report a problem</LinkButton>
            <LinkButton href="/dashboard/importer/support/new" variant="ghost">Contact support</LinkButton>
          </span>
        </Notice>
      ) : (
        <>
          <Section title="What cancelling means for you" description={outcome.note}>
            <div className="space-y-4">
              <SimulationNotice kind="payment" />
              <FinancialSummary
                title="Estimated outcome"
                lines={[
                  { label: "Amount paid", amountRwf: outcome.paidAmountRwf, hint: paid ? undefined : "Nothing has been paid yet" },
                  { label: `Cancellation fee (${(CANCELLATION_POLICY.find((row) => row.stage === stage)?.feeRate ?? 0) * 100}%)`, amountRwf: outcome.feeRwf, kind: "deduct" },
                  { label: "Refundable amount", amountRwf: outcome.refundRwf, kind: "total" },
                ]}
                footnote={outcome.requiresReview ? "This request requires administrator review. Nothing is refunded until it is approved, and the final amount may change." : "No payment was taken, so there is nothing to refund."}
              />
              {outcome.requiresReview ? <Notice tone="warning" title="Requires administrator review">Your request is sent for review. Until approved, the booking stays active.</Notice> : null}
            </div>
          </Section>

          <Section title="Request cancellation">
            <form onSubmit={(event) => void submit(event)} noValidate className="space-y-4">
              <FormField label="Reason" required error={formState.errors.reason?.message}>
                <select className={controlClass} aria-invalid={Boolean(formState.errors.reason)} {...register("reason")}>
                  <option value="">Choose a reason</option>
                  {CANCEL_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                </select>
              </FormField>
              <FormField label="Details" hint="Required when the reason is Other." error={formState.errors.details?.message}>
                <textarea className={`${controlClass} min-h-24`} aria-invalid={Boolean(formState.errors.details)} {...register("details")} />
              </FormField>
              <ConfirmButton
                label="Request cancellation"
                title="Request to cancel this booking?"
                message="Please check the outcome before you continue."
                summary={[
                  `Booking: ${route}`,
                  `Cancellation fee: ${formatRwf(outcome.feeRwf)}`,
                  `Refundable amount: ${formatRwf(outcome.refundRwf)} (simulated)`,
                  outcome.requiresReview ? "An administrator reviews the request first." : "No payment was taken.",
                ]}
                confirmLabel="Yes, request cancellation"
                tone="danger"
                disabled={busy || !actor || !formState.isValid}
                onConfirm={() => submit()}
              />
              {!formState.isValid ? <p className="text-xs text-muted">Choose a reason to continue.</p> : null}
            </form>
          </Section>
        </>
      )}
    </div>
  );
}
