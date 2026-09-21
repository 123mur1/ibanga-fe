"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { BookingBadge, PayNotice } from "@/components/status-badge";
import { PriceAgree } from "@/components/price-agree";
import { Field, GhostButton, inputClass, PrimaryButton, formatDate } from "@/components/ui";
import { useIbanga } from "@/lib/store";

export default function ImporterBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { bookings, trucks, users, currentUser, setBookingStatus, reportProblem } =
    useIbanga();
  const booking = bookings.find(
    (b) => b.id === id && b.importerId === currentUser?.id,
  );
  const truck = booking ? trucks.find((t) => t.id === booking.truckId) : undefined;
  const owner = truck ? users.find((u) => u.id === truck.ownerId) : undefined;
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <RequireAuth role="IMPORTER">
      <DashboardShell role="IMPORTER">
        {!booking ? (
          <p>Booking not found.</p>
        ) : (
          <div className="max-w-3xl">
            <Link href="/dashboard/importer/bookings" className="text-sm text-brand">
              ← My bookings
            </Link>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <h1 className="font-display text-3xl text-navy">
                {booking.pickupLocation} → {booking.destination}
              </h1>
              <BookingBadge status={booking.status} />
            </div>
            <p className="mt-2 text-muted">
              {booking.cargoType} · {booking.cargoWeight} · pickup{" "}
              {formatDate(booking.pickupDate)}
            </p>
            <p className="mt-4 text-navy">{booking.cargoDescription}</p>
            {booking.additionalInstructions ? (
              <p className="mt-2 text-sm text-muted">
                Instructions: {booking.additionalInstructions}
              </p>
            ) : null}

            {truck && owner ? (
              <div className="mt-6 rounded-2xl border border-line bg-card p-5">
                <p className="text-sm text-muted">Truck & owner</p>
                <p className="font-semibold text-navy">
                  {truck.plateNumber} · {truck.truckType}
                </p>
                <p className="mt-2">
                  {owner.name} · {owner.phone}
                </p>
                <Link href={`/trucks/${truck.id}`} className="text-sm text-brand">
                  Truck profile
                </Link>
              </div>
            ) : null}

            <div className="mt-4">
              <PayNotice />
            </div>

            <div className="mt-4">
              <PriceAgree
                bookingId={booking.id}
                currentPrice={booking.agreedPrice}
                pending={booking.status === "PENDING"}
              />
            </div>

            {booking.status === "PENDING" ? (
              <p className="mt-4 text-sm text-muted">
                This booking already made the truck unavailable. After the
                price is saved, the owner can accept or reject. A reject puts
                the truck back on the market.
              </p>
            ) : null}

            {booking.status === "REJECTED" ? (
              <p className="mt-4 text-sm text-muted">
                The owner rejected this request. The truck is available again.
              </p>
            ) : null}

            {booking.status === "DELIVERED" ? (
              <div className="mt-6 space-y-4 rounded-2xl border border-line bg-card p-5">
                <p className="font-display text-xl text-navy">
                  Goods marked delivered
                </p>
                <p className="text-sm text-muted">
                  Check the cargo. Confirming receipt completes the trip and
                  makes the truck available again. Reporting a problem keeps
                  the truck locked until admin resolves it.
                </p>
                <PrimaryButton
                  type="button"
                  onClick={() => {
                    setBookingStatus(booking.id, "COMPLETED");
                    setMessage("Receipt confirmed. Trip completed.");
                  }}
                >
                  Confirm receipt
                </PrimaryButton>
                <Field label="Or report a problem">
                  <textarea
                    className={`${inputClass} min-h-20`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="What is wrong with the delivery?"
                  />
                </Field>
                <GhostButton
                  type="button"
                  onClick={() => {
                    if (!reason.trim()) {
                      setMessage("Please describe the problem.");
                      return;
                    }
                    reportProblem(booking.id, reason.trim());
                    setMessage("Dispute opened. Admin will review.");
                  }}
                >
                  Report problem
                </GhostButton>
              </div>
            ) : null}

            {message ? <p className="mt-4 text-sm text-good">{message}</p> : null}
          </div>
        )}
      </DashboardShell>
    </RequireAuth>
  );
}
