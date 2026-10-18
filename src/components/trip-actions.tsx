"use client";

import { useToast } from "@/components/toast";
import { GhostButton, PrimaryButton } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import type { Booking, BookingStatus } from "@/lib/types";

export function TripActions({ booking }: { booking: Booking }) {
  const { setBookingStatus } = useIbanga();
  const toast = useToast();

  async function move(status: BookingStatus, success: string) {
    const error = await setBookingStatus(booking.id, status);
    toast(error ?? success, error ? "bad" : "good");
  }

  if (booking.status === "PENDING") {
    return (
      <div className="flex flex-wrap gap-3 rounded-xl border border-line bg-card p-4">
        <PrimaryButton type="button" onClick={() => void move("ACCEPTED", "Truck confirmed.")}>
          Confirm truck is available
        </PrimaryButton>
        <GhostButton type="button" className="hover:border-bad/30 hover:text-bad" onClick={() => void move("REJECTED", "Request declined.")}>
          Decline request
        </GhostButton>
      </div>
    );
  }

  if (booking.status === "ACCEPTED" && booking.payment?.status === "FUNDED") {
    return (
      <div className="rounded-xl border border-line bg-card p-4">
        <p className="text-sm text-muted">Payment is in. Start the trip when the truck leaves.</p>
        <PrimaryButton className="mt-3" type="button" onClick={() => void move("IN_PROGRESS", "Trip started.")}>
          Start trip
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
        <PrimaryButton className="mt-3" type="button" onClick={() => void move("DELIVERED", "Delivery recorded.")}>
          Confirm cargo delivered
        </PrimaryButton>
      </div>
    );
  }

  return null;
}
