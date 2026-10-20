"use client";

import { useState } from "react";
import { controlClass, FormField } from "@/components/common/form-fields";
import { Notice } from "@/components/common/notices";
import { Section } from "@/components/common/layout-blocks";
import { GhostButton, PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { applyFieldErrors, useZodForm } from "@/lib/forms";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { MilestoneKind, Shipment } from "@/types/ops";
import { delaySchema } from "./schemas";

const STEPS: { kind: MilestoneKind; label: string; place: string }[] = [
  { kind: "PICKUP_CONFIRMED", label: "Pickup confirmed", place: "Pickup point" },
  { kind: "LOADED", label: "Cargo loaded", place: "Pickup point" },
  { kind: "DEPARTED", label: "Departed", place: "Pickup point" },
  { kind: "IN_TRANSIT_UPDATE", label: "In-transit update", place: "On route" },
  { kind: "ARRIVED", label: "Arrived", place: "Destination" },
  { kind: "UNLOADING", label: "Unloading", place: "Destination" },
];

/** Kinds the next click may record. Mirrors the service rules; the service still enforces them. */
const ALLOWED: Record<string, MilestoneKind[]> = {
  SCHEDULED: ["PICKUP_CONFIRMED"],
  PICKUP_CONFIRMED: ["LOADED"],
  LOADED: ["DEPARTED"],
  DEPARTED: ["IN_TRANSIT_UPDATE", "ARRIVED"],
  IN_TRANSIT: ["IN_TRANSIT_UPDATE", "ARRIVED"],
  DELAYED: ["IN_TRANSIT_UPDATE", "ARRIVED"],
  ARRIVED: ["UNLOADING"],
};
const PRIMARY: Record<string, MilestoneKind> = {
  SCHEDULED: "PICKUP_CONFIRMED",
  PICKUP_CONFIRMED: "LOADED",
  LOADED: "DEPARTED",
  DEPARTED: "ARRIVED",
  IN_TRANSIT: "ARRIVED",
  DELAYED: "ARRIVED",
  ARRIVED: "UNLOADING",
};

export function MilestonePanel({ shipment }: { shipment: Shipment }) {
  const actor = useActor();
  const { bookings, setBookingStatus } = useIbanga();
  const { run, busy } = useAction();
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const booking = bookings.find((item) => item.id === shipment.bookingId);
  const paid = Boolean(booking?.payment && ["FUNDED", "HELD"].includes(booking.payment.status));
  const allowed = ALLOWED[shipment.status] ?? [];
  const closed = ["DELIVERED", "COMPLETED", "CANCELLED"].includes(shipment.status);

  async function record(kind: MilestoneKind, fallbackPlace: string) {
    if (!actor) return;
    const done = await run(
      () => services.shipments.recordMilestone(actor, shipment.id, { kind, place: place.trim() || fallbackPlace, note: note.trim() }),
      { success: kind === "DEPARTED" ? "Departure recorded. The importer has been notified." : "Milestone recorded." },
    );
    if (!done) return;
    setNote("");
    // Departure moves the coarse booking status forward, but only when the booking is confirmed and paid.
    if (actor.role === "TRUCK_OWNER" && kind === "DEPARTED" && booking?.status === "ACCEPTED" && paid) {
      await run(async () => {
        const problem = await setBookingStatus(booking.id, "IN_PROGRESS");
        if (problem) throw new Error(problem);
      });
    }
  }

  return (
    <Section title="Record milestone" description="Record shipment progress.">
      <div className="space-y-4">
        {!paid && !closed ? (
          <Notice tone="warning" title="This shipment cannot load or depart yet">
            The importer&apos;s payment has not been confirmed on the booking. Loading and departure unlock only when the payment shows as paid and held by iBanga.
          </Notice>
        ) : null}
        {closed ? <Notice tone="info">This shipment is {shipment.status.toLowerCase()}, so no further milestones can be recorded.</Notice> : null}
        {shipment.status === "ARRIVED" || shipment.status === "UNLOADING" ? (
          <Notice tone="info" title="Next: submit delivery evidence">Delivery is recorded only by submitting proof of delivery, not by a status button.</Notice>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Where is the truck?" hint="Leave empty to use a default place for the step.">
            <input className={controlClass} value={place} onChange={(event) => setPlace(event.target.value)} placeholder="e.g. Rusumo border" />
          </FormField>
          <FormField label="Note (optional)">
            <input className={controlClass} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Anything the importer should know" />
          </FormField>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Record milestone">
          {STEPS.map((step) => {
            const blockedByPayment = !paid && (step.kind === "LOADED" || step.kind === "DEPARTED");
            const enabled = !closed && allowed.includes(step.kind) && !blockedByPayment && !busy;
            const Button = PRIMARY[shipment.status] === step.kind ? PrimaryButton : GhostButton;
            return (
              <Button key={step.kind} type="button" disabled={!enabled} onClick={() => void record(step.kind, step.place)} aria-label={`Simulate: ${step.label}`}>
                {step.label}
              </Button>
            );
          })}
        </div>
        <p className="text-xs text-muted">The highlighted button is the next allowed step. Steps that are out of order are disabled.</p>
      </div>
    </Section>
  );
}

export function DelayForm({ shipment }: { shipment: Shipment }) {
  const actor = useActor();
  const { run, busy } = useAction();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useZodForm(delaySchema, { defaultValues: { reason: "", newEtaDate: "" } });
  const onRoad = ["DEPARTED", "IN_TRANSIT", "DELAYED"].includes(shipment.status);

  const submit = handleSubmit(async (values) => {
    if (!actor) return;
    const done = await run(() => services.shipments.reportDelay(actor, shipment.id, values), {
      success: "Delay reported. The importer has been notified.",
      onError: (_error, fields) => applyFieldErrors(setError, fields),
    });
    if (done) reset();
  });

  return (
    <Section title="Report a delay" description="Tell the importer when the truck will now arrive.">
      {!onRoad ? (
        <p className="text-sm text-muted">A delay can be reported once the shipment has departed and until it arrives.</p>
      ) : (
        <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2">
          <FormField label="Reason" required error={errors.reason?.message} className="sm:col-span-2">
            <textarea className={`${controlClass} min-h-20`} aria-invalid={Boolean(errors.reason)} {...register("reason")} />
          </FormField>
          <FormField label="New estimated delivery date" required error={errors.newEtaDate?.message}>
            <input type="date" className={controlClass} aria-invalid={Boolean(errors.newEtaDate)} {...register("newEtaDate")} />
          </FormField>
          <div className="flex items-end">
            <PrimaryButton type="submit" disabled={busy}>{busy ? "Reporting…" : "Report delay"}</PrimaryButton>
          </div>
        </form>
      )}
    </Section>
  );
}
