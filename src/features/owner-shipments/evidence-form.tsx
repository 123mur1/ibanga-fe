"use client";

import Link from "next/link";
import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { CheckRow, controlClass, FilePicker, FormField } from "@/components/common/form-fields";
import { BackLink, DetailList, Section } from "@/components/common/layout-blocks";
import { Notice, SimulationNotice } from "@/components/common/notices";
import { SignaturePad } from "@/components/common/signature-pad";
import { StatusBadge } from "@/components/common/status-badge";
import { GhostButton, PageHeader, PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDateTime } from "@/lib/format";
import { applyFieldErrors, useZodForm, type PickedFile } from "@/lib/forms";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { DeliveryEvidence, Shipment } from "@/types/ops";
import { evidenceSchema, type EvidenceValues } from "./schemas";

export function EvidencePage({ shipmentId }: { shipmentId: string }) {
  const actor = useActor();
  const query = useServiceQuery(() => services.shipments.get(actor!, shipmentId), [actor?.id, shipmentId]);
  return (
    <div className="space-y-5">
      <BackLink href="/dashboard/owner/delivery-evidence">Delivery evidence</BackLink>
      <QueryBoundary query={query} loadingLabel="Loading shipment">{(shipment) => <EvidenceContent shipment={shipment} />}</QueryBoundary>
    </div>
  );
}

function EvidenceContent({ shipment }: { shipment: Shipment }) {
  const { bookings } = useIbanga();
  const booking = bookings.find((item) => item.id === shipment.bookingId);
  const evidence = shipment.evidence;
  const rejected = evidence?.verification === "REJECTED";
  const canSubmit = rejected || ["ARRIVED", "UNLOADING"].includes(shipment.status);

  return (
    <>
      <PageHeader
        eyebrow={shipment.ref}
        title="Proof of delivery"
        subtitle={booking ? `${booking.pickupLocation} to ${booking.destination}, ${booking.cargoType}` : undefined}
        actions={<Link href={`/dashboard/owner/shipments/${shipment.id}`} className="text-sm font-semibold text-brand hover:underline">Open shipment</Link>}
      />
      <SimulationNotice kind="verification" />
      {evidence ? <EvidenceStatus evidence={evidence} /> : null}
      {evidence && !rejected ? null : canSubmit ? (
        <EvidenceForm shipment={shipment} resubmitting={rejected} />
      ) : (
        <Notice tone="warning" title="Delivery evidence is not due yet">
          Evidence can be submitted once the shipment has arrived. It is currently &ldquo;{shipment.status.replaceAll("_", " ").toLowerCase()}&rdquo;.
        </Notice>
      )}
    </>
  );
}

function EvidenceStatus({ evidence }: { evidence: DeliveryEvidence }) {
  return (
    <Section title="Submitted evidence" actions={<StatusBadge family="evidence" status={evidence.verification} />}>
      <div className="space-y-4">
        {evidence.verification === "SUBMITTED" ? (
          <Notice tone="info" title="Submitted, awaiting administrator verification">
            Your proof of delivery was sent {formatDateTime(evidence.submittedAt)}. The delivery is not verified, and your settlement cannot be released, until an administrator reviews it.
          </Notice>
        ) : null}
        {evidence.verification === "VERIFIED" ? (
          <Notice tone="success" title="Verified by an administrator (demonstration)">Verified {formatDateTime(evidence.verifiedAt)}. Check your earnings for the settlement status.</Notice>
        ) : null}
        {evidence.verification === "REJECTED" ? (
          <Notice tone="danger" title="An administrator rejected this evidence">
            Reason: {evidence.rejectionReason ?? "No reason was recorded."} Fix the problem and resubmit below.
          </Notice>
        ) : null}
        <DetailList
          items={[
            { label: "Recipient", value: evidence.recipientName },
            { label: "Confirmation code", value: evidence.confirmationCode },
            { label: "Delivered at", value: formatDateTime(evidence.deliveredAt) },
            { label: "Damage reported", value: evidence.damageReported ? "Yes" : "No" },
            { label: "Shortage reported", value: evidence.shortageReported ? "Yes" : "No" },
            { label: "Notes", value: evidence.notes || "—", wide: true },
          ]}
        />
        {evidence.photos.length ? (
          <ul className="grid gap-3 sm:grid-cols-3">
            {evidence.photos.map((url, index) => (
              <li key={`${index}-${url.slice(-12)}`} className="overflow-hidden rounded-lg border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Delivery photo ${index + 1}`} className="h-32 w-full object-cover" />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Section>
  );
}

function EvidenceForm({ shipment, resubmitting }: { shipment: Shipment; resubmitting: boolean }) {
  const actor = useActor();
  const { run, busy } = useAction();
  const [photos, setPhotos] = useState<PickedFile[]>([]);
  const [signature, setSignature] = useState<string>();
  const [photoError, setPhotoError] = useState<string>();
  const [review, setReview] = useState<EvidenceValues | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useZodForm(evidenceSchema, {
    defaultValues: { recipientName: "", confirmationCode: "", deliveredAt: "", damageReported: false, shortageReported: false, notes: "" },
  });
  const flagged = watch("damageReported") || watch("shortageReported");

  const toReview = handleSubmit((values) => {
    if (!photos.length) {
      setPhotoError("Add at least one delivery photo.");
      return;
    }
    setPhotoError(undefined);
    setReview(values);
  });

  async function submit() {
    if (!actor || !review) return;
    const done = await run(
      () =>
        services.shipments.submitEvidence(actor, shipment.id, {
          ...review,
          deliveredAt: new Date(review.deliveredAt).toISOString(),
          signatureDataUrl: signature,
          photos: photos.map((file) => file.url),
        }),
      {
        success: "Submitted, awaiting administrator verification.",
        onError: (_error, fields) => {
          applyFieldErrors(setError, fields);
          if (fields?.photos) setPhotoError(fields.photos);
          setReview(null);
        },
      },
    );
    if (done) setReview(null);
  }

  if (review) {
    return (
      <Section title="Review and confirm" description="Check everything. Once submitted, an administrator decides whether the delivery is verified.">
        <div className="space-y-4">
          <DetailList
            items={[
              { label: "Recipient", value: review.recipientName },
              { label: "Confirmation code", value: review.confirmationCode },
              { label: "Delivered at", value: formatDateTime(review.deliveredAt) },
              { label: "Photos", value: `${photos.length} attached` },
              { label: "Signature", value: signature ? "Captured" : "Not captured" },
              { label: "Damage / shortage", value: `${review.damageReported ? "Damage" : "No damage"}, ${review.shortageReported ? "shortage" : "no shortage"}` },
              { label: "Notes", value: review.notes || "—", wide: true },
            ]}
          />
          {review.damageReported || review.shortageReported ? (
            <Notice tone="warning" title="Flagged delivery">The importer and administrators will see the damage or shortage. This can place your settlement under review.</Notice>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <PrimaryButton type="button" disabled={busy} onClick={() => void submit()}>{busy ? "Submitting…" : "Confirm and submit"}</PrimaryButton>
            <GhostButton type="button" disabled={busy} onClick={() => setReview(null)}>Back to edit</GhostButton>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section title={resubmitting ? "Resubmit proof of delivery" : "Proof of delivery"} description="Fill in what the recipient confirmed at the destination.">
      <form onSubmit={toReview} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Recipient name" required error={errors.recipientName?.message}>
            <input className={controlClass} aria-invalid={Boolean(errors.recipientName)} {...register("recipientName")} />
          </FormField>
          <FormField label="Delivery confirmation code" required hint="Placeholder: ask the recipient for the code. Any code is accepted in this demonstration." error={errors.confirmationCode?.message}>
            <input className={controlClass} aria-invalid={Boolean(errors.confirmationCode)} {...register("confirmationCode")} />
          </FormField>
          <FormField label="Delivered on" required error={errors.deliveredAt?.message}>
            <input type="datetime-local" className={controlClass} aria-invalid={Boolean(errors.deliveredAt)} {...register("deliveredAt")} />
            <button type="button" className="mt-1 text-xs font-semibold text-brand hover:underline" onClick={() => setValue("deliveredAt", toLocalInput(new Date()), { shouldValidate: true })}>
              Use current time
            </button>
          </FormField>
        </div>
        <SignaturePad value={signature} onChange={setSignature} />
        <FilePicker label="Delivery photos" multiple files={photos} onChange={(next) => { setPhotos(next); setPhotoError(undefined); }} error={photoError} />
        <div className="grid gap-3 sm:grid-cols-2">
          <CheckRow title="Cargo was damaged" description="A note is required." checked={watch("damageReported")} onChange={(checked) => setValue("damageReported", checked, { shouldValidate: true })} />
          <CheckRow title="Cargo is short" description="Some items are missing. A note is required." checked={watch("shortageReported")} onChange={(checked) => setValue("shortageReported", checked, { shouldValidate: true })} />
        </div>
        <FormField label={flagged ? "Describe the damage or shortage" : "Notes (optional)"} required={flagged} error={errors.notes?.message}>
          <textarea className={`${controlClass} min-h-24`} aria-invalid={Boolean(errors.notes)} {...register("notes")} />
        </FormField>
        <PrimaryButton type="submit">Review before submitting</PrimaryButton>
      </form>
    </Section>
  );
}

function toLocalInput(date: Date) {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}
