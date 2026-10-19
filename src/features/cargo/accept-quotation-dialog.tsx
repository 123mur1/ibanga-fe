"use client";

import { useState } from "react";
import { FinancialSummary } from "@/components/common/financial-summary";
import { DetailList } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { GhostButton, Modal, PrimaryButton } from "@/components/ui";
import { CANCELLATION_POLICY, feeBreakdown } from "@/config/business-rules";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { formatDate } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { ServiceError, services } from "@/services";
import type { CargoRequest, Quotation } from "@/types/ops";
import { bookingFromQuotation } from "./booking-from-quotation";

/**
 * Review step before a quotation becomes a booking. The booking is created unpaid; payment is a
 * separate step on the booking page. Both writes must succeed together: if the request was booked
 * in the meantime (CONFLICT) the provisional booking is withdrawn again, so no orphan is left.
 */
export function AcceptQuotationDialog({
  request,
  quotation,
  ownerName,
  onClose,
  onBooked,
}: {
  request: CargoRequest;
  quotation: Quotation;
  ownerName: string;
  onClose: () => void;
  onBooked: (bookingId: string) => void;
}) {
  const actor = useActor();
  const { addBooking, setBookingStatus } = useIbanga();
  const { run, busy } = useAction();
  const [understood, setUnderstood] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const fees = feeBreakdown(quotation.amountRwf);

  async function confirm() {
    if (!actor) return;
    setProblem(null);
    const bookingId = await run(
      async () => {
        // Re-check on the server side of the demo first, so a stale screen never creates a booking.
        const [fresh, quotes] = await Promise.all([
          services.cargoRequests.get(actor, request.id),
          services.quotations.listForRequest(actor, request.id),
        ]);
        const current = quotes.find((item) => item.id === quotation.id);
        if (fresh.status === "BOOKED" || fresh.acceptedQuotationId) throw new ServiceError("CONFLICT", "This request is already booked. No second booking was created.");
        if (!current || current.status !== "SUBMITTED") throw new ServiceError("CONFLICT", "This quotation is no longer available.");

        const booking = bookingFromQuotation(fresh, current);
        const failure = await addBooking(booking);
        if (failure) throw new ServiceError("VALIDATION", failure);
        try {
          await services.quotations.accept(actor, current.id, booking.id);
        } catch (error) {
          await setBookingStatus(booking.id, "REJECTED");
          throw error;
        }
        return booking.id;
      },
      {
        success: "Quotation accepted. Your booking is confirmed and awaiting payment.",
        onError: (error) => {
          if (error instanceof ServiceError && error.code === "CONFLICT") setProblem(error.message);
        },
      },
    );
    if (bookingId) onBooked(bookingId);
  }

  return (
    <Modal
      wide
      title="Review before you accept"
      description={`${quotation.ref} from ${ownerName}`}
      onClose={() => !busy && onClose()}
      footer={
        problem ? (
          <GhostButton type="button" onClick={onClose}>Close</GhostButton>
        ) : (
          <>
            <GhostButton type="button" disabled={busy} onClick={onClose}>Not yet</GhostButton>
            <PrimaryButton type="button" disabled={busy || !understood || !actor} onClick={() => void confirm()}>
              {busy ? "Creating booking…" : "Accept and create booking"}
            </PrimaryButton>
          </>
        )
      }
    >
      <div className="space-y-4">
        {problem ? (
          <Notice tone="danger" title="This quotation could not be accepted">{problem} No payment was taken and nothing was changed.</Notice>
        ) : (
          <>
            <Notice tone="info" title="What happens next">
              Accepting turns this quotation into a confirmed booking and a scheduled shipment. You then pay from the booking page. <strong>You are not charged now.</strong>
            </Notice>
            <DetailList
              items={[
                { label: "Route", value: `${request.pickup.location} to ${request.delivery.location}` },
                { label: "Pickup", value: formatDate(quotation.estimatedPickupDate) },
                { label: "Estimated delivery", value: formatDate(quotation.estimatedDeliveryDate) },
                { label: "Truck owner", value: ownerName },
              ]}
            />
            <FinancialSummary
              title="Agreed price"
              lines={[
                { label: "Agreed transport price", amountRwf: fees.agreedRwf },
                { label: "Platform fee (deducted from the owner share)", amountRwf: fees.platformFeeRwf, kind: "plain", hint: "6% of the agreed price" },
                { label: "Total payable by you", amountRwf: fees.totalPayableRwf, kind: "total" },
              ]}
              footnote="Simulated amounts. No money moves until you pay on the booking page."
            />
            <div className="rounded-xl border border-line bg-background/50 p-4">
              <p className="text-sm font-semibold text-navy">Cancellation policy</p>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {CANCELLATION_POLICY.map((row) => <li key={row.stage}><strong className="text-navy">{row.label}:</strong> {row.feeRate === 0 ? "no fee" : `${row.feeRate * 100}% fee`}.</li>)}
              </ul>
            </div>
            <label className="flex items-start gap-3 text-sm text-navy">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-brand" checked={understood} onChange={(event) => setUnderstood(event.target.checked)} />
              I understand this creates a booking at {fees.agreedRwf.toLocaleString("en-RW")} RWF, that payment is a separate step, and that the cancellation policy above applies.
            </label>
          </>
        )}
      </div>
    </Modal>
  );
}
