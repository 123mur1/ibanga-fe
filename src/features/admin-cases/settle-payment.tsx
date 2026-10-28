"use client";

import { useState } from "react";
import { ConfirmButton } from "@/components/common/confirm-button";
import { controlClass, FormField } from "@/components/common/form-fields";
import { Notice } from "@/components/common/notices";
import { formatRwf } from "@/lib/payments";
import { useIbanga } from "@/lib/store";
import type { Booking } from "@/lib/types";
import { useToast } from "@/components/toast";

/** Whether the booking still has the importer's payment held in escrow. */
export function hasHeldPayment(booking: Booking | undefined): booking is Booking & { payment: NonNullable<Booking["payment"]> } {
  return Boolean(booking?.payment && ["FUNDED", "HELD"].includes(booking.payment.status) && booking.status !== "COMPLETED");
}

/**
 * Who receives what when `refundRwf` of the held payment goes back to the importer. Mirrors the
 * API: the platform commission is taken only on the part released to the owner.
 */
export function settlementSplit(payment: NonNullable<Booking["payment"]>, refundRwf: number) {
  const ownerGross = payment.amountRwf - refundRwf;
  const commission = payment.amountRwf ? Math.round((payment.commissionRwf * ownerGross) / payment.amountRwf) : 0;
  return { importer: refundRwf, owner: ownerGross - commission, commission };
}

export function settlementSummary(payment: NonNullable<Booking["payment"]>, refundRwf: number): string[] {
  const split = settlementSplit(payment, refundRwf);
  return [
    split.importer ? `${formatRwf(split.importer)} goes back to the importer's iBanga wallet` : "The importer receives no refund",
    split.owner ? `${formatRwf(split.owner)} is released to the truck owner` : "The truck owner receives nothing",
    split.commission ? `${formatRwf(split.commission)} platform commission` : "No commission is kept",
    "The booking is closed and both parties are notified. This cannot be undone.",
  ];
}

type Outcome = "FULL_REFUND" | "PARTIAL_REFUND" | "RELEASE_TO_OWNER";

const OUTCOMES: { value: Outcome; label: string; hint: string }[] = [
  { value: "FULL_REFUND", label: "Refund the importer in full", hint: "The truck owner is at fault." },
  { value: "PARTIAL_REFUND", label: "Partial refund", hint: "Both share responsibility." },
  { value: "RELEASE_TO_OWNER", label: "Release payment to the owner", hint: "The truck owner is not at fault." },
];

/**
 * Settles a disputed booking from the booking page: refund the importer, pay the owner, or split
 * the held payment. Money moves at once, from escrow to the parties' iBanga wallets.
 */
export function SettlePaymentPanel({ booking }: { booking: Booking }) {
  const { settleDispute } = useIbanga();
  const toast = useToast();
  const [outcome, setOutcome] = useState<Outcome>("FULL_REFUND");
  const [partial, setPartial] = useState("");
  const [notes, setNotes] = useState("");

  if (!hasHeldPayment(booking)) {
    return <p className="text-sm text-muted">There is no payment held in escrow for this booking, so there is nothing to refund or release.</p>;
  }
  const payment = booking.payment;
  const refundRwf = outcome === "FULL_REFUND" ? payment.amountRwf : outcome === "RELEASE_TO_OWNER" ? 0 : Number(partial);
  const amountValid = Number.isInteger(refundRwf) && refundRwf >= 0 && refundRwf <= payment.amountRwf && (outcome !== "PARTIAL_REFUND" || (refundRwf > 0 && refundRwf < payment.amountRwf));
  const notesValid = notes.trim().length >= 5;

  return (
    <div className="space-y-4">
      <Notice tone="info" title={`${formatRwf(payment.amountRwf)} is held in escrow`}>
        Decide who receives it. A refund goes to the importer&apos;s iBanga wallet, from where they can withdraw it.
      </Notice>
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium text-navy">Decision</legend>
        {OUTCOMES.map((option) => (
          <label key={option.value} className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-2.5 text-sm ${outcome === option.value ? "border-brand bg-brand-soft/40" : "border-line"}`}>
            <input type="radio" name={`settle-${booking.id}`} className="mt-0.5" checked={outcome === option.value} onChange={() => setOutcome(option.value)} />
            <span>
              <span className="block font-semibold text-navy">{option.label}</span>
              <span className="text-muted">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {outcome === "PARTIAL_REFUND" ? (
        <FormField label="Amount refunded to the importer (RWF)" required error={partial && !amountValid ? `Enter a whole amount between 1 and ${payment.amountRwf - 1}.` : undefined}>
          <input type="number" min={1} max={payment.amountRwf - 1} step={1} className={controlClass} value={partial} onChange={(event) => setPartial(event.target.value)} />
        </FormField>
      ) : null}
      <FormField label="Reason for the decision" required hint="Shown to the importer and the truck owner.">
        <textarea className={`${controlClass} min-h-24 resize-y`} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </FormField>
      <ConfirmButton
        label={outcome === "RELEASE_TO_OWNER" ? "Release payment to owner" : "Refund importer"}
        title="Settle this dispute?"
        message="Money moves from escrow straight away."
        summary={amountValid ? settlementSummary(payment, refundRwf) : undefined}
        tone={outcome === "RELEASE_TO_OWNER" ? "brand" : "danger"}
        disabled={!amountValid || !notesValid}
        onConfirm={async () => {
          const error = await settleDispute(booking.id, { refundRwf, resolutionNotes: notes.trim() });
          toast(error ?? (refundRwf ? "Refund issued and the dispute is settled." : "Payment released and the dispute is settled."), error ? "bad" : "good");
        }}
      />
      {!notesValid ? <p className="text-xs text-muted">Write the reason (at least 5 characters) to continue.</p> : null}
    </div>
  );
}
