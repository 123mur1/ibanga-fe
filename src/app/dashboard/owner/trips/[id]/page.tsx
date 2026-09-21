"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { BookingBadge } from "@/components/status-badge";
import { PriceAgree } from "@/components/price-agree";
import { GhostButton, PrimaryButton, formatDate } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import type { BookingStatus } from "@/lib/types";
import { useState } from "react";

export default function OwnerTripDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, bookings, trucks, users, setBookingStatus } = useIbanga();
  const mine = trucks.filter((t) => t.ownerId === currentUser?.id);
  const booking = bookings.find(
    (b) => b.id === id && mine.some((t) => t.id === b.truckId),
  );
  const truck = booking ? trucks.find((t) => t.id === booking.truckId) : undefined;
  const importer = booking
    ? users.find((u) => u.id === booking.importerId)
    : undefined;

  const [actionError, setActionError] = useState<string | null>(null);

  function act(status: BookingStatus) {
    const err = setBookingStatus(id, status);
    setActionError(err);
  }

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        {!booking ? (
          <p>Booking not found.</p>
        ) : (
          <div className="max-w-3xl">
            <Link href="/dashboard/owner/requests" className="text-sm text-brand">
              ← Back
            </Link>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <h1 className="font-display text-3xl text-navy">
                {booking.pickupLocation} → {booking.destination}
              </h1>
              <BookingBadge status={booking.status} />
            </div>
            <p className="mt-2 text-muted">
              {booking.cargoType} · {booking.cargoWeight} · pickup{" "}
              {formatDate(booking.pickupDate)} · expected{" "}
              {formatDate(booking.expectedDeliveryDate)}
            </p>
            <p className="mt-4">{booking.cargoDescription}</p>
            {importer ? (
              <p className="mt-4 text-sm">
                Importer: {importer.name} · {importer.phone}
              </p>
            ) : null}
            {truck ? (
              <p className="text-sm text-muted">
                Truck {truck.plateNumber} · {truck.truckType} · {truck.status}
              </p>
            ) : null}

            {booking.status === "PENDING" ? (
              <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
                This booking already made the truck unavailable. Agree the
                price, then accept (keep it locked) or reject (make it
                available again).
              </p>
            ) : null}

            <div className="mt-6">
              <PriceAgree
                bookingId={booking.id}
                currentPrice={booking.agreedPrice}
                pending={booking.status === "PENDING"}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {booking.status === "PENDING" ? (
                <>
                  <PrimaryButton
                    type="button"
                    disabled={!booking.agreedPrice.trim()}
                    onClick={() => act("ACCEPTED")}
                  >
                    Accept booking
                  </PrimaryButton>
                  <GhostButton type="button" onClick={() => act("REJECTED")}>
                    Reject — make truck available
                  </GhostButton>
                </>
              ) : null}
              {booking.status === "ACCEPTED" ? (
                <PrimaryButton type="button" onClick={() => act("IN_PROGRESS")}>
                  Start trip
                </PrimaryButton>
              ) : null}
              {booking.status === "IN_PROGRESS" ? (
                <PrimaryButton type="button" onClick={() => act("DELIVERED")}>
                  Mark delivered
                </PrimaryButton>
              ) : null}
            </div>
            {actionError ? (
              <p className="mt-3 text-sm text-bad">{actionError}</p>
            ) : null}
            {booking.status === "REJECTED" ? (
              <p className="mt-4 text-sm text-good">
                You rejected this request. The truck is available again.
              </p>
            ) : null}
            {booking.status === "DELIVERED" ? (
              <p className="mt-4 text-sm text-muted">
                Waiting for the importer to confirm receipt. Marking delivered
                does not free the truck.
              </p>
            ) : null}
            {booking.status === "DISPUTED" ? (
              <p className="mt-4 text-sm text-bad">
                Importer reported a problem. The truck stays unavailable until
                admin resolves the dispute.
              </p>
            ) : null}
          </div>
        )}
      </DashboardShell>
    </RequireAuth>
  );
}
