"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmButton } from "@/components/common/confirm-button";
import { controlClass, FormField } from "@/components/common/form-fields";
import { Notice } from "@/components/common/notices";
import { Section } from "@/components/common/layout-blocks";
import { PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { applyFieldErrors, useZodForm } from "@/lib/forms";
import { formatRwf } from "@/lib/format";
import { services } from "@/services";
import type { Booking } from "@/lib/types";
import { useIbanga } from "@/lib/store";
import type { DisputeCase } from "@/types/ops";
import { hasHeldPayment, settlementSummary } from "./settle-payment";
import { useUserNames } from "../admin-platform/admin-page";
import { DECISION_TYPES, optionList } from "./constants";
import { decisionSchema, infoRequestSchema, noteSchema, proposalSchema, statusNoteSchema } from "./schemas";
import { TextForm } from "./text-form";

export function AssignPanel({ dispute }: { dispute: DisputeCase }) {
  const actor = useActor()!;
  const { adminProfiles } = useOps();
  const name = useUserNames();
  const { run, busy } = useAction();
  return (
    <Section title="Assignment" description="The administrator responsible for this case.">
      <label className="block text-sm font-medium text-navy">
        Assigned administrator
        <select
          className={`${controlClass} mt-1.5`}
          value={dispute.assignedTo ?? ""}
          disabled={busy}
          onChange={(event) => event.target.value && void run(() => services.disputes.assign(actor, dispute.id, event.target.value), { success: "Case assigned." })}
        >
          <option value="">Unassigned</option>
          {adminProfiles.map((profile) => (
            <option key={profile.userId} value={profile.userId}>{name(profile.userId)}</option>
          ))}
        </select>
      </label>
      <p className="mt-2 text-xs text-muted">Assigning an open case moves it to &quot;Under review&quot;.</p>
    </Section>
  );
}

export function NoteForm({ dispute }: { dispute: DisputeCase }) {
  const actor = useActor()!;
  const { run, busy } = useAction();
  const { register, handleSubmit, reset, setError, formState: { errors } } = useZodForm(noteSchema, { defaultValues: { text: "", visibility: "internal" } });
  const submit = handleSubmit(async (values) => {
    const done = await run(() => services.disputes.addNote(actor, dispute.id, values.text, values.visibility === "internal"), {
      success: values.visibility === "internal" ? "Internal note saved." : "Note saved and visible to both parties.",
      toastError: false,
      onError: (_, fields) => applyFieldErrors(setError, fields),
    });
    if (done) reset();
  });
  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <FormField label="Add a note" error={errors.text?.message}>
        <textarea className={`${controlClass} min-h-20 resize-y`} aria-invalid={Boolean(errors.text)} disabled={busy} {...register("text")} />
      </FormField>
      <fieldset className="flex flex-wrap gap-4 text-sm text-navy">
        <legend className="sr-only">Who can see this note</legend>
        <label className="flex items-center gap-2"><input type="radio" value="internal" className="accent-brand" {...register("visibility")} /> Internal (administrators only)</label>
        <label className="flex items-center gap-2"><input type="radio" value="parties" className="accent-brand" {...register("visibility")} /> Visible to the parties</label>
      </fieldset>
      <PrimaryButton type="submit" disabled={busy}>{busy ? "Saving…" : "Save note"}</PrimaryButton>
    </form>
  );
}

export function ResolutionPanel({ dispute }: { dispute: DisputeCase }) {
  const actor = useActor()!;
  const closed = ["RESOLVED", "REJECTED"].includes(dispute.status);
  return (
    <Section title="Resolution workflow" description="Ask for information, propose an outcome, then record the decision.">
      <div className="space-y-6">
        {dispute.infoRequest ? <Notice tone="warning" title="Information requested">{dispute.infoRequest}</Notice> : null}
        {dispute.proposedResolution ? <Notice tone="info" title="Proposed resolution">{dispute.proposedResolution}</Notice> : null}
        <TextForm
          schema={infoRequestSchema}
          field="request"
          label="Request additional information"
          placeholder="What do the parties need to provide?"
          submitLabel="Send request"
          success="Information requested. The case is awaiting the parties."
          disabled={closed}
          hint="Both parties are notified and the case moves to Awaiting information."
          onSubmit={(text) => services.disputes.requestInfo(actor, dispute.id, text)}
        />
        <TextForm
          schema={proposalSchema}
          field="proposal"
          label="Propose a resolution"
          placeholder="Describe the outcome you propose."
          submitLabel="Save proposal"
          success="Proposed resolution saved."
          disabled={closed}
          onSubmit={(text) => services.disputes.proposeResolution(actor, dispute.id, text)}
        />
      </div>
    </Section>
  );
}

export function DecisionPanel({ dispute }: { dispute: DisputeCase }) {
  const actor = useActor()!;
  const { run, busy } = useAction();
  const { bookings, settleDispute } = useIbanga();
  const { register, watch, getValues, formState: { errors } } = useZodForm(decisionSchema, { defaultValues: { type: "NO_ACTION", amountRwf: 0, note: "" } });
  const values = watch();
  const booking = bookings.find((item) => item.id === dispute.bookingId);
  // While the importer's payment is still held, a refund or release decision also moves the money.
  const held = hasHeldPayment(booking) ? booking.payment : null;
  const refundRwf =
    !held || !MONEY_DECISIONS.includes(values.type)
      ? null
      : values.type === "FULL_REFUND"
        ? held.amountRwf
        : values.type === "RELEASE_TO_OWNER"
          ? 0
          : values.amountRwf;
  const refundTooLarge = held !== null && refundRwf !== null && refundRwf > held.amountRwf;
  // With a held payment the full refund amount is filled in, so validate what will actually be paid.
  const valid = decisionSchema.safeParse({ ...values, amountRwf: refundRwf ?? values.amountRwf }).success && !refundTooLarge;
  const needsAmount = !["NO_ACTION", "RELEASE_TO_OWNER", ...(held ? ["FULL_REFUND"] : [])].includes(values.type);

  if (dispute.decision) {
    return (
      <Section title="Recorded decision">
        <p className="font-semibold text-navy">{DECISION_TYPES[dispute.decision.type]}{dispute.decision.amountRwf ? ` · ${formatRwf(dispute.decision.amountRwf)}` : ""}</p>
        <p className="mt-1 text-sm text-muted">{dispute.decision.note}</p>
        {booking?.payment?.status === "REFUNDED" ? (
          <div className="mt-4"><Notice tone="success" title="Refunded">{formatRwf(booking.payment.amountRwf)} was returned to the importer&apos;s iBanga wallet.</Notice></div>
        ) : null}
      </Section>
    );
  }
  if (["RESOLVED", "REJECTED"].includes(dispute.status)) return null;

  return (
    <Section title="Record a decision" description="Closes the case as resolved and notifies both parties.">
      <MoneyNotice held={held} refundRwf={refundRwf} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormField label="Decision" required error={errors.type?.message}>
          <select className={controlClass} {...register("type")}>
            {optionList(DECISION_TYPES).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </FormField>
        <FormField
          label={values.type === "PARTIAL_REFUND" && held ? "Amount refunded to the importer (RWF)" : "Decided amount (RWF)"}
          required={needsAmount}
          error={refundTooLarge ? `The importer paid ${formatRwf(held!.amountRwf)}; the refund cannot be larger.` : errors.amountRwf?.message}
          hint={values.type === "FULL_REFUND" && held ? `The full ${formatRwf(held.amountRwf)} is refunded.` : needsAmount ? (held && refundRwf !== null ? "Paid from the held payment." : "A record only: no money is moved.") : "Not needed for this decision."}
        >
          <input type="number" min={0} className={controlClass} disabled={!needsAmount} aria-invalid={Boolean(errors.amountRwf)} {...register("amountRwf", { valueAsNumber: true })} />
        </FormField>
        <FormField label="Reasoning" required error={errors.note?.message} className="sm:col-span-2">
          <textarea className={`${controlClass} min-h-24 resize-y`} aria-invalid={Boolean(errors.note)} {...register("note")} />
        </FormField>
      </div>
      <div className="mt-4">
        <ConfirmButton
          label="Record decision and resolve"
          title="Record this decision?"
          message="The case will be marked resolved and both parties will be notified."
          summary={[
            `Decision: ${DECISION_TYPES[values.type]}${refundRwf ? ` (${formatRwf(refundRwf)})` : needsAmount && Number.isFinite(values.amountRwf) ? ` (${formatRwf(values.amountRwf)})` : ""}`,
            ...(held && refundRwf !== null ? settlementSummary(held, refundRwf) : ["No payment, refund or payout is processed by this action."]),
          ]}
          disabled={!valid || busy}
          onConfirm={() =>
            run(
              async () => {
                const { type, note } = getValues();
                if (held && refundRwf !== null) {
                  const error = await settleDispute(dispute.bookingId, { refundRwf, resolutionNotes: note.trim() });
                  if (error) throw new Error(error);
                }
                return services.disputes.decide(actor, dispute.id, { type, note, amountRwf: refundRwf ?? (needsAmount ? getValues().amountRwf : 0) });
              },
              { success: held && refundRwf !== null ? (refundRwf ? "Refund issued and the case is resolved." : "Payment released to the owner and the case is resolved.") : "Decision recorded." },
            )
          }
        />
        {!valid ? <p className="mt-2 text-xs text-muted">Complete the decision, amount (when needed) and reasoning to enable this button.</p> : null}
      </div>
    </Section>
  );
}

const MONEY_DECISIONS: string[] = ["FULL_REFUND", "PARTIAL_REFUND", "RELEASE_TO_OWNER"];

function MoneyNotice({ held, refundRwf }: { held: NonNullable<Booking["payment"]> | null; refundRwf: number | null }) {
  if (held) {
    return (
      <Notice tone="info" title={`${formatRwf(held.amountRwf)} is held in escrow for this booking`}>
        {refundRwf === null
          ? "Choose a full or partial refund, or release to the owner, and the money moves when you record the decision. Other decisions are only a record."
          : refundRwf
            ? `Recording this decision returns ${formatRwf(refundRwf)} to the importer's iBanga wallet straight away.`
            : "Recording this decision releases the payment to the truck owner straight away."}
      </Notice>
    );
  }
  return (
    <Notice tone="warning" title="No payment is held for this booking">
      The decision is only a record. To move money, use{" "}
      <Link href="/dashboard/admin/refunds" className="font-semibold underline">Refund management</Link> or{" "}
      <Link href="/dashboard/admin/settlements" className="font-semibold underline">Settlements &amp; payouts</Link>.
    </Notice>
  );
}

export function StatusActions({ dispute }: { dispute: DisputeCase }) {
  const actor = useActor()!;
  const { run, busy } = useAction();
  const [mode, setMode] = useState(false);
  const { register, watch, getValues, formState: { errors } } = useZodForm(statusNoteSchema, { defaultValues: { note: "" } });
  const valid = statusNoteSchema.safeParse(watch()).success;
  if (["RESOLVED", "REJECTED"].includes(dispute.status)) return null;

  return (
    <Section title="Escalate, reject or close">
      <div className="flex flex-wrap gap-3">
        <ConfirmButton
          label="Escalate"
          variant="ghost"
          title="Escalate this case?"
          message="Escalated cases are flagged for senior review. The settlement hold stays in place."
          disabled={busy || dispute.status === "ESCALATED"}
          onConfirm={() => run(() => services.disputes.setStatus(actor, dispute.id, "ESCALATED"), { success: "Case escalated." })}
        />
        <ConfirmButton
          label="Close without a decision"
          variant="ghost"
          title="Close this case?"
          message="The case is marked resolved with no recorded decision and the settlement hold is released."
          disabled={busy}
          onConfirm={() => run(() => services.disputes.setStatus(actor, dispute.id, "RESOLVED"), { success: "Case closed." })}
        />
        <button type="button" onClick={() => setMode((value) => !value)} className="rounded-lg border border-bad/30 px-4 py-2 text-sm font-semibold text-bad hover:bg-bad-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" aria-expanded={mode}>
          Reject case
        </button>
      </div>
      {mode ? (
        <div className="mt-4 space-y-3">
          <FormField label="Reason for rejecting (shown to the importer)" required error={errors.note?.message}>
            <textarea className={`${controlClass} min-h-20 resize-y`} aria-invalid={Boolean(errors.note)} {...register("note")} />
          </FormField>
          <ConfirmButton
            label="Reject case"
            tone="danger"
            title="Reject this dispute?"
            message="The case is closed as rejected and the reason is recorded."
            summary={["The settlement hold is released.", "No money is moved."]}
            disabled={!valid || busy}
            onConfirm={() => run(() => services.disputes.setStatus(actor, dispute.id, "REJECTED", getValues().note), { success: "Case rejected." })}
          />
        </div>
      ) : null}
    </Section>
  );
}
