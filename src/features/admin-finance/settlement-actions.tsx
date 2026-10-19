"use client";

import { ConfirmButton } from "@/components/common/confirm-button";
import { controlClass, FormField } from "@/components/common/form-fields";
import { Notice } from "@/components/common/notices";
import { netPayable, type SettlementEvaluation } from "@/config/business-rules";
import { useAction } from "@/hooks/use-action";
import { formatRwf } from "@/lib/format";
import { applyFieldErrors, useZodForm } from "@/lib/forms";
import { ServiceError, services, type Actor } from "@/services";
import type { Settlement } from "@/types/ops";
import { NoteAction } from "./finance-parts";
import { adjustmentSchema, type AdjustmentValues } from "./schemas";

const SIM = "Simulation only: no money moves.";

/** Every action here is administrator-only and financially sensitive, so each one is confirmed. */
export function SettlementActions({
  settlement,
  evaluation,
  actor,
  canAct,
}: {
  settlement: Settlement;
  evaluation: SettlementEvaluation | null;
  actor: Actor;
  canAct: boolean;
}) {
  const { run, busy } = useAction();
  const status = settlement.status;
  const approvable = status === "ELIGIBLE" && evaluation?.status === "ELIGIBLE";
  const canHold = !settlement.holdReason && !["PAID", "PROCESSING"].includes(status);

  if (!canAct) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-navy">Payout</h3>
        {status === "ELIGIBLE" && !approvable ? (
          <Notice tone="warning" title="Approval is blocked">
            The live check no longer finds this settlement eligible: {evaluation?.reasons[0] ?? "booking data is missing"}
          </Notice>
        ) : null}
        {status === "ELIGIBLE" ? (
          <ConfirmButton
            label="Approve settlement"
            title="Approve this settlement?"
            message="This starts a simulated payout to the truck owner."
            summary={[`Net payout ${formatRwf(settlement.netAmountRwf)} to the owner`, `Platform fee ${formatRwf(settlement.platformFeeRwf)} retained`, SIM]}
            disabled={!approvable || busy}
            onConfirm={() => run(async () => { await services.settlements.approve(actor, settlement.id); return true; }, { success: "Settlement approved. A simulated payout is processing." })}
          />
        ) : null}
        {status === "PROCESSING" ? (
          <div className="space-y-4">
            <ConfirmButton
              label="Mark payout paid"
              title="Record this payout as paid?"
              message="This records the simulated provider result as paid."
              summary={[`Amount ${formatRwf(settlement.netAmountRwf)}`, SIM, "A real provider confirmation would be needed in production."]}
              disabled={busy}
              onConfirm={() => run(async () => { await services.settlements.completePayout(actor, settlement.id, "PAID"); return true; }, { success: "Payout recorded as paid (simulated)." })}
            />
            <NoteAction
              fieldLabel="Failure reason"
              placeholder="For example: mobile money account rejected the transfer"
              errorMessage="Enter the failure reason (at least 5 characters)."
              label="Mark payout failed"
              title="Record this payout as failed?"
              message="The settlement moves to Failed and can be retried."
              variant="ghost"
              tone="danger"
              disabled={busy}
              summary={(note) => [`Reason: ${note}`, SIM]}
              onConfirm={(note) => run(async () => { await services.settlements.completePayout(actor, settlement.id, "FAILED", note); return true; }, { success: "Payout recorded as failed (simulated)." })}
            />
          </div>
        ) : null}
        {status === "FAILED" ? (
          <>
            {settlement.failureReason ? <Notice tone="danger" title="Last failure">{settlement.failureReason}</Notice> : null}
            <ConfirmButton
              label="Retry payout"
              title="Retry this payout?"
              message="This sends the payout back to processing."
              summary={[`Amount ${formatRwf(settlement.netAmountRwf)}`, SIM, "The backend must make retries idempotent so an owner is never paid twice."]}
              disabled={busy}
              onConfirm={() => run(async () => { await services.settlements.retryPayout(actor, settlement.id); return true; }, { success: "Payout retry started (simulated)." })}
            />
          </>
        ) : null}
        {!["ELIGIBLE", "PROCESSING", "FAILED"].includes(status) ? (
          <p className="text-sm text-muted">No payout action is available while the settlement is {status.replaceAll("_", " ").toLowerCase()}.</p>
        ) : null}
      </div>

      <div className="space-y-3 border-t border-line pt-5">
        <h3 className="text-sm font-semibold text-navy">Hold</h3>
        {status === "ON_HOLD" ? (
          <ConfirmButton
            label="Release hold"
            title="Release the administrator hold?"
            message="Eligibility is checked again afterwards."
            summary={["Disputes and incidents still keep a settlement on hold until they are resolved."]}
            variant="ghost"
            disabled={busy}
            onConfirm={() => run(async () => { await services.settlements.releaseHold(actor, settlement.id); return true; }, { success: "Hold released." })}
          />
        ) : null}
        {canHold ? (
          <NoteAction
            fieldLabel="Hold reason"
            placeholder="Why is this payout being held?"
            errorMessage="Give a reason for the hold (at least 5 characters)."
            label="Place on hold"
            title="Place this settlement on hold?"
            message="The owner will not be paid until the hold is released."
            variant="ghost"
            tone="danger"
            disabled={busy}
            summary={(note) => [`Reason: ${note}`]}
            onConfirm={(note) => run(async () => { await services.settlements.hold(actor, settlement.id, note); return true; }, { success: "Settlement placed on hold." })}
          />
        ) : status !== "ON_HOLD" ? (
          <p className="text-sm text-muted">A hold cannot be placed while a payout is in progress or complete.</p>
        ) : null}
      </div>

      <div className="border-t border-line pt-5">
        <AdjustmentForm settlement={settlement} actor={actor} />
      </div>
    </div>
  );
}

function AdjustmentForm({ settlement, actor }: { settlement: Settlement; actor: Actor }) {
  const { run, busy } = useAction();
  const form = useZodForm(adjustmentSchema, { mode: "onChange", defaultValues: { direction: "DECREASE", amount: "", note: "" } });
  const { register, formState, watch, setError, reset } = form;
  const values = watch();
  const parsedAmount = /^\d+$/.test(values.amount ?? "") ? Number(values.amount) : 0;
  const signed = (values.direction === "INCREASE" ? 1 : -1) * parsedAmount;
  const preview = netPayable(settlement.agreedAmountRwf, settlement.platformFeeRwf, settlement.deductionsRwf, settlement.adjustmentsRwf + signed);

  async function submit(input: AdjustmentValues) {
    const amountRwf = (input.direction === "INCREASE" ? 1 : -1) * Number(input.amount);
    await run(
      async () => {
        await services.settlements.addAdjustment(actor, settlement.id, { amountRwf, note: input.note });
        reset();
        return true;
      },
      {
        success: "Adjustment recorded (simulated).",
        onError: (error) => {
          if (error instanceof ServiceError) applyFieldErrors(setError, error.fieldErrors);
        },
      },
    );
  }

  return (
    <form className="space-y-3" onSubmit={(event) => event.preventDefault()} noValidate>
      <h3 className="text-sm font-semibold text-navy">Add an adjustment</h3>
      <p className="text-xs text-muted">Use a minus adjustment for refunds or compensation owed, a plus for corrections in the owner&apos;s favour.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Direction" required>
          <select className={controlClass} {...register("direction")}>
            <option value="DECREASE">Minus (reduces the payout)</option>
            <option value="INCREASE">Plus (increases the payout)</option>
          </select>
        </FormField>
        <FormField label="Amount (RWF)" required error={formState.errors.amount?.message}>
          <input inputMode="numeric" className={controlClass} aria-invalid={Boolean(formState.errors.amount)} {...register("amount")} />
        </FormField>
      </div>
      <FormField label="Note" required error={formState.errors.note?.message}>
        <textarea rows={2} className={controlClass} aria-invalid={Boolean(formState.errors.note)} {...register("note")} />
      </FormField>
      <ConfirmButton
        label="Add adjustment"
        title="Add this adjustment?"
        message="The settlement's net payout changes."
        summary={[
          `Adjustment ${signed < 0 ? "−" : "+"}${formatRwf(Math.abs(signed))}`,
          `Net payout becomes ${formatRwf(preview)} (now ${formatRwf(settlement.netAmountRwf)})`,
          settlement.status === "PAID" ? "The settlement is already paid, so it will be marked Reversed / adjusted." : SIM,
        ]}
        variant="ghost"
        disabled={!formState.isValid || busy}
        onConfirm={() => form.handleSubmit(submit)()}
      />
    </form>
  );
}
