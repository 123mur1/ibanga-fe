"use client";

import Link from "next/link";
import { ConfirmButton } from "@/components/common/confirm-button";
import { Section } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { cancellationStageFor } from "@/config/business-rules";
import { useAction } from "@/hooks/use-action";
import { useIbanga } from "@/lib/store";
import type { Shipment } from "@/types/ops";
import { LinkButton } from "./link-button";

/**
 * What the importer can do about a shipment. Receipt can be confirmed only once delivery is
 * VERIFIED: submitted evidence alone is not verified delivery.
 */
export function ShipmentActions({ shipment }: { shipment: Shipment }) {
  const { bookings, setBookingStatus } = useIbanga();
  const { run, busy } = useAction();
  const booking = bookings.find((item) => item.id === shipment.bookingId);
  if (!booking) return null;
  const bookingId = booking.id;

  const verified = shipment.evidence?.verification === "VERIFIED";
  const awaitingConfirm = booking.status === "DELIVERED";
  const canConfirm = awaitingConfirm && verified;
  const cancelStage = cancellationStageFor(booking, shipment);

  async function confirmReceipt() {
    await run(
      async () => {
        const failure = await setBookingStatus(bookingId, "COMPLETED");
        if (failure) throw new Error(failure);
      },
      { success: "Receipt confirmed. The booking is complete." },
    );
  }

  return (
    <Section title="Your actions">
      <div className="space-y-4">
        {booking.status === "COMPLETED" ? <Notice tone="success" title="You confirmed receipt">This booking is complete.</Notice> : null}
        {booking.status === "DISPUTED" ? <Notice tone="danger" title="Disputed">A dispute is open for this booking. Confirming receipt is unavailable until it is resolved.</Notice> : null}
        {awaitingConfirm && !verified ? (
          <Notice tone="warning" title="Waiting for delivery verification">
            The truck owner has marked the cargo delivered, but an administrator has not verified the proof of delivery yet. You can confirm receipt once it is verified. If something is wrong, report a problem.
          </Notice>
        ) : null}
        {canConfirm ? <Notice tone="info" title="Delivery verified">Please confirm you received the cargo in good condition.</Notice> : null}
        <div className="flex flex-wrap gap-3">
          {canConfirm ? (
            <ConfirmButton
              label="Confirm receipt"
              title="Confirm you received the cargo?"
              message="This completes the booking."
              summary={["The booking is marked completed.", "The truck owner's settlement can then proceed (simulated).", "To dispute damage or shortage, report a problem instead."]}
              disabled={busy}
              onConfirm={confirmReceipt}
            />
          ) : null}
          <LinkButton href={`/dashboard/importer/disputes/new?booking=${bookingId}`} variant="ghost">Report a problem</LinkButton>
          <LinkButton href="/dashboard/importer/support/new" variant="ghost">Contact support</LinkButton>
          {cancelStage ? <LinkButton href={`/dashboard/importer/bookings/${bookingId}/cancel`} variant="ghost">Cancel booking</LinkButton> : null}
        </div>
        {!cancelStage && !["COMPLETED", "REJECTED"].includes(booking.status) ? (
          <p className="text-xs text-muted">This booking can no longer be cancelled because it is delivered or disputed. Use &quot;Report a problem&quot; instead.</p>
        ) : null}
        <p className="text-xs text-muted">
          <Link href={`/dashboard/importer/bookings/${bookingId}`} className="font-semibold text-brand">View the booking</Link> for payment and contract details.
        </p>
      </div>
    </Section>
  );
}
