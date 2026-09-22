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

  async function act(status: BookingStatus) {
    const err = await setBookingStatus(id, status);
    setActionError(err);
  }

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        {!booking ? (
          <p>Booking not found.</p>
        ) : (
          <div className="max-w-3xl">
            <Link
              href="/dashboard/owner/requests"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 4-8 8 8 8" />
              </svg>
              Requests
            </Link>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <h1 className="font-display text-3xl tracking-tight text-navy">
                {booking.pickupLocation} → {booking.destination}
              </h1>
              <BookingBadge status={booking.status} />
            </div>

            <div className="mt-6 rounded-2xl border border-line bg-card p-6 shadow-soft">
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Cargo
                  </dt>
                  <dd className="mt-1 font-medium text-navy">{booking.cargoType}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Weight
                  </dt>
                  <dd className="mt-1 font-medium text-navy">{booking.cargoWeight}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Pickup
                  </dt>
                  <dd className="mt-1 font-medium text-navy">
                    {formatDate(booking.pickupDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Expected delivery
                  </dt>
                  <dd className="mt-1 font-medium text-navy">
                    {formatDate(booking.expectedDeliveryDate)}
                  </dd>
                </div>
              </dl>
              <div className="mt-5 border-t border-line pt-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Description
                </dt>
                <dd className="mt-1.5 text-navy">{booking.cargoDescription}</dd>
              </div>
            </div>

            {importer ? (
              <div className="mt-4 rounded-2xl border border-line bg-card p-6 shadow-soft">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="8" r="3.5" />
                      <path d="M5 20a7 7 0 0 1 14 0" />
                    </svg>
                  </span>
                  <p className="font-display text-lg text-navy">Importer</p>
                </div>
                <p className="mt-4 font-medium text-navy">
                  {importer.name} · {importer.phone}
                </p>
              </div>
            ) : null}
            {truck ? (
              <p className="mt-4 text-sm text-muted">
                Truck {truck.plateNumber} · {truck.truckType} · {truck.status}
              </p>
            ) : null}

            {booking.status === "PENDING" ? (
              <div className="mt-4 rounded-2xl bg-warn-soft px-4 py-3.5 text-sm font-medium text-warn ring-1 ring-warn/10">
                This booking already made the truck unavailable. Agree the
                price, then accept (keep it locked) or reject (make it
                available again).
              </div>
            ) : null}

            <div className="mt-5">
              <PriceAgree
                bookingId={booking.id}
                currentPrice={booking.agreedPrice}
                pending={booking.status === "PENDING"}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
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
              <p className="mt-3 inline-flex rounded-xl bg-bad-soft px-3 py-2 text-sm font-medium text-bad">
                {actionError}
              </p>
            ) : null}
            {booking.status === "REJECTED" ? (
              <p className="mt-4 inline-flex rounded-xl bg-good-soft px-3 py-2 text-sm font-medium text-good">
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
              <p className="mt-4 inline-flex rounded-xl bg-bad-soft px-3 py-2 text-sm font-medium text-bad">
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
