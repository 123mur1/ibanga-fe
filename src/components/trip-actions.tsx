"use client";

import { useState } from "react";
import { useToast } from "@/components/toast";
import { GhostButton, PrimaryButton } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import type { Booking, BookingStatus } from "@/lib/types";

export function TripActions({ booking }: { booking: Booking }) {
  const { setBookingStatus } = useIbanga();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function move(status: BookingStatus, success: string) {
    if (busy) return;
    setBusy(true);
    try {
      const error = await setBookingStatus(booking.id, status);
      toast(error ?? success, error ? "bad" : "good");
    } finally {
      setBusy(false);
    }
  }

  if (booking.status === "PENDING") {
    return (
      <div className="flex flex-wrap gap-3 rounded-xl border border-line bg-card p-4">
        <PrimaryButton type="button" disabled={busy} onClick={() => void move("ACCEPTED", "Truck confirmed.")}>
          {busy ? "Confirming…" : "Confirm truck is available"}
        </PrimaryButton>
        <GhostButton type="button" disabled={busy} className="hover:border-bad/30 hover:text-bad" onClick={() => void move("REJECTED", "Request declined.")}>
          {busy ? "Please wait…" : "Decline request"}
        </GhostButton>
      </div>
    );
  }

  if (booking.status === "ACCEPTED" && booking.payment && ["FUNDED", "HELD", "AUTHORIZED"].includes(booking.payment.status)) {
    return (
      <div className="rounded-xl border border-line bg-card p-4">
        <p className="text-sm text-muted">Payment is in. Start the trip when the truck leaves.</p>
        <PrimaryButton className="mt-3" type="button" disabled={busy} onClick={() => void move("IN_PROGRESS", "Trip started.")}>
          {busy ? "Starting…" : "Start trip"}
        </PrimaryButton>
      </div>
    );
  }

  if (booking.status === "ACCEPTED") {
    return (
      <p className="rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
        Waiting for the importer to pay before this trip can start.
      </p>
    );
  }

  if (booking.status === "IN_PROGRESS") {
    return (
      <div className="rounded-xl border border-line bg-card p-4">
        <p className="text-sm text-muted">Mark the cargo delivered when it reaches the destination.</p>
        <PrimaryButton className="mt-3" type="button" disabled={busy} onClick={() => void move("DELIVERED", "Delivery recorded.")}>
          {busy ? "Updating…" : "Confirm cargo delivered"}
        </PrimaryButton>
      </div>
    );
  }

  return null;
}
