"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BackLink, Section } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { RoleShell } from "@/components/common/role-shell";
import { controlClass, FilePicker, FormField } from "@/components/common/form-fields";
import { GhostButton, PageHeader, PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { applyFieldErrors, useZodForm, type PickedFile } from "@/lib/forms";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import { portalBase, type PortalRole } from "@/features/support/portal";
import { DISPUTE_CATEGORIES, DISPUTE_CATEGORY_LABELS, disputeSchema } from "./schemas";

export function DisputeForm({ role }: { role: PortalRole }) {
  const actor = useActor();
  const router = useRouter();
  const params = useSearchParams();
  const { bookings, trucks, currentUser } = useIbanga();
  const base = portalBase(role);
  const { run, busy } = useAction();
  const [evidence, setEvidence] = useState<PickedFile[]>([]);

  // Only the signed-in user's own bookings can be disputed (the service enforces this as well).
  const mine = bookings.filter((booking) =>
    role === "IMPORTER" ? booking.importerId === currentUser?.id : trucks.find((truck) => truck.id === booking.truckId)?.ownerId === currentUser?.id,
  );
  const requested = params.get("booking") ?? "";
  const initialBooking = mine.some((booking) => booking.id === requested) ? requested : "";

  const { register, handleSubmit, setError, formState: { errors } } = useZodForm(disputeSchema, {
    defaultValues: { bookingId: initialBooking, category: "DAMAGED_CARGO", description: "" },
  });

  const submit = handleSubmit(async (values) => {
    if (!actor) return;
    const dispute = await run(
      () => services.disputes.open(actor, { ...values, evidence: evidence.map((file) => ({ name: file.name, url: file.url })) }),
      { success: "Dispute opened. The settlement is on hold.", onError: (_error, fields) => applyFieldErrors(setError, fields) },
    );
    if (dispute) router.push(`${base}/disputes/${dispute.id}`);
  });

  return (
    <RoleShell role={role}>
      <BackLink href={`${base}/disputes`}>All disputes</BackLink>
      <div className="mt-4">
        <PageHeader eyebrow="Resolution" title="Open a dispute" subtitle="Describe what went wrong and attach any evidence. An administrator will review the case." />
      </div>
      <form onSubmit={submit} noValidate className="mt-6 max-w-3xl space-y-5">
        <Notice tone="warning" title="This places a hold on the owner's settlement">
          While the dispute is open, the truck owner&apos;s settlement for this booking is held. A recorded decision does not move money by itself: refunds and payouts are separate steps.
        </Notice>
        <Section title="Dispute details">
          <div className="space-y-4">
            <FormField label="Booking" required error={errors.bookingId?.message} hint={requested && !initialBooking ? "The booking in the link is not one of yours." : undefined}>
              <select className={controlClass} aria-invalid={Boolean(errors.bookingId)} {...register("bookingId")}>
                <option value="">Choose one of your bookings</option>
                {mine.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.pickupLocation} to {booking.destination} · {booking.cargoType} · {booking.id}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="What is the problem about?" error={errors.category?.message}>
              <select className={controlClass} {...register("category")}>
                {DISPUTE_CATEGORIES.map((key) => <option key={key} value={key}>{DISPUTE_CATEGORY_LABELS[key]}</option>)}
              </select>
            </FormField>
            <FormField label="Description" required error={errors.description?.message} hint="At least 20 characters. Say what happened, when and what you expect.">
              <textarea className={`${controlClass} min-h-36 resize-y`} aria-invalid={Boolean(errors.description)} {...register("description")} />
            </FormField>
            <FilePicker label="Evidence (optional)" files={evidence} onChange={setEvidence} multiple />
          </div>
        </Section>
        {mine.length === 0 ? <Notice title="No bookings yet">You can only open a dispute on a booking that belongs to you.</Notice> : null}
        <div className="flex flex-wrap gap-3">
          <PrimaryButton type="submit" disabled={busy || mine.length === 0}>{busy ? "Opening…" : "Open dispute"}</PrimaryButton>
          <GhostButton type="button" disabled={busy} onClick={() => router.push(`${base}/disputes`)}>Cancel</GhostButton>
        </div>
      </form>
    </RoleShell>
  );
}
