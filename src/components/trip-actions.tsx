"use client";

import { FormEvent, useState } from "react";
import { useToast } from "@/components/toast";
import { Field, GhostButton, PrimaryButton, inputClass } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import type { Booking } from "@/lib/types";

export function TripActions({ booking }: { booking: Booking }) {
  const { currentUser, setBookingStatus, notifyDeparture, notifyRest, notifyResume, recordCheckpoint, refundBooking } = useIbanga();
  const toast = useToast();
  const [departureAt, setDepartureAt] = useState("");
  const [restAt, setRestAt] = useState("");
  const [restPlace, setRestPlace] = useState("");
  const [restNote, setRestNote] = useState("");

  async function run(action: () => Promise<string | null>, success: string) {
    const error = await action();
    toast(error ?? success, error ? "bad" : "good");
  }

  function submitDeparture(event: FormEvent) {
    event.preventDefault();
    void run(
      () => notifyDeparture(booking.id, new Date(departureAt).toISOString(), booking.pickupLocation, "Departure recorded by the truck owner."),
      "Departure saved. The live trail has started.",
    );
  }

  function submitRest(event: FormEvent) {
    event.preventDefault();
    void run(
      () => notifyRest(booking.id, new Date(restAt).toISOString(), restPlace, restNote || "Rest stop recorded."),
      "Rest stop added to the live trail.",
    );
  }

  return (
    <div className="space-y-4">
      {booking.status === "PENDING" ? (
        <div className="flex flex-wrap gap-3">
          <PrimaryButton type="button" onClick={() => void run(() => setBookingStatus(booking.id, "ACCEPTED"), "Truck confirmed. Payment is now held by iBanga.")}>
            Confirm truck is available
          </PrimaryButton>
          <GhostButton type="button" className="hover:border-bad/30 hover:text-bad" onClick={() => void run(() => setBookingStatus(booking.id, "REJECTED"), "Request declined and the payment was refunded.")}>
            Decline and refund
          </GhostButton>
        </div>
      ) : null}

      {booking.status === "ACCEPTED" ? (
        <form onSubmit={submitDeparture} className="rounded-2xl border border-line bg-card p-4 shadow-soft">
          <h3 className="font-semibold text-navy">Departure time</h3>
          <p className="mt-1 text-sm text-muted">Record the exact departure before the cargo trail starts.</p>
          <div className="mt-3 max-w-sm">
            <Field label="Date and time">
              <input className={inputClass} type="datetime-local" required value={departureAt} onChange={(event) => setDepartureAt(event.target.value)} />
            </Field>
          </div>
          <PrimaryButton className="mt-3" type="submit">Save departure and start trip</PrimaryButton>
        </form>
      ) : null}

      {booking.status === "IN_PROGRESS" ? (
        <div className="space-y-4 rounded-2xl border border-line bg-card p-4 shadow-soft">
          <div className="flex flex-wrap gap-3">
            <PrimaryButton type="button" onClick={() => void run(() => recordCheckpoint(booking.id), "Position saved, 2 km ahead of the last checkpoint.")}>
              Record next 2 km
            </PrimaryButton>
            <GhostButton type="button" onClick={() => void run(() => notifyResume(booking.id, "Rest finished. Moving again."), "Resume noted on the live trail.")}>
              Resume after rest
            </GhostButton>
            <PrimaryButton type="button" onClick={() => void run(() => setBookingStatus(booking.id, "DELIVERED"), "Delivery confirmed. Payment stays held until the importer confirms receipt.")}>
              Confirm cargo delivered
            </PrimaryButton>
          </div>
          <form onSubmit={submitRest} className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
            <Field label="Rest time">
              <input className={inputClass} type="datetime-local" required value={restAt} onChange={(event) => setRestAt(event.target.value)} />
            </Field>
            <Field label="Rest place">
              <input className={inputClass} required value={restPlace} onChange={(event) => setRestPlace(event.target.value)} placeholder="Town or roadside stop" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Note">
                <input className={inputClass} value={restNote} onChange={(event) => setRestNote(event.target.value)} placeholder="How long, and why" />
              </Field>
            </div>
            <GhostButton type="submit">Log rest stop</GhostButton>
          </form>
        </div>
      ) : null}

      {booking.status === "DISPUTED" && currentUser?.role === "ADMIN" ? (
        <GhostButton type="button" className="hover:border-warn/40 hover:text-warn" onClick={() => void run(() => refundBooking(booking.id, "Refund issued after dispute review."), "Refund sent back to the original payment method.")}>
          Refund the payer
        </GhostButton>
      ) : null}
    </div>
  );
}
