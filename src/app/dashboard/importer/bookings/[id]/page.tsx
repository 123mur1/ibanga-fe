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
            <Link
              href="/dashboard/importer/bookings"
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
              My bookings
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
              {booking.additionalInstructions ? (
                <div className="mt-4 border-t border-line pt-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Instructions
                  </dt>
                  <dd className="mt-1.5 text-sm text-muted">
                    {booking.additionalInstructions}
                  </dd>
                </div>
              ) : null}
            </div>

            {truck && owner ? (
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
                      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
                    </svg>
                  </span>
                  <p className="font-display text-lg text-navy">Truck &amp; owner</p>
                </div>
                <p className="mt-4">
                  <span className="font-semibold text-navy">
                    {truck.plateNumber} · {truck.truckType}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted">
                  {owner.name} · {owner.phone}
                </p>
                <Link
                  href={`/trucks/${truck.id}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  Truck profile
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
                    <path d="m9 5 7 7-7 7" />
                  </svg>
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
              <p className="mt-4 rounded-2xl bg-warn-soft px-4 py-3 text-sm font-medium text-warn ring-1 ring-warn/10">
                This booking already made the truck unavailable. After the price
                is saved, the owner can accept or reject. A reject puts the
                truck back on the market.
              </p>
            ) : null}

            {booking.status === "REJECTED" ? (
              <p className="mt-4 text-sm text-muted">
                The owner rejected this request. The truck is available again.
              </p>
            ) : null}

            {booking.status === "DELIVERED" ? (
              <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                <div className="border-b border-line bg-good-soft/50 px-5 py-4">
                  <p className="font-display text-xl tracking-tight text-navy">
                    Goods marked delivered
                  </p>
                </div>
                <div className="space-y-4 px-5 py-5">
                  <p className="text-sm text-muted">
                    Check the cargo. Confirming receipt completes the trip and
                    makes the truck available again. Reporting a problem keeps
                    the truck locked until admin resolves it.
                  </p>
                  <PrimaryButton
                    type="button"
                    onClick={async () => {
                      const error = await setBookingStatus(booking.id, "COMPLETED");
                      setMessage(error ?? "Receipt confirmed. Trip completed.");
                    }}
                  >
                    Confirm receipt
                  </PrimaryButton>
                  <div className="space-y-3 border-t border-line pt-4">
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
                      onClick={async () => {
                        if (!reason.trim()) {
                          setMessage("Please describe the problem.");
                          return;
                        }
                        const error = await reportProblem(booking.id, reason.trim());
                        setMessage(error ?? "Dispute opened. Admin will review.");
                      }}
                    >
                      Report problem
                    </GhostButton>
                  </div>
                </div>
              </div>
            ) : null}

            {message ? (
              <p className="mt-4 inline-flex rounded-xl bg-good-soft px-3 py-2 text-sm font-medium text-good">
                {message}
              </p>
            ) : null}
          </div>
        )}
      </DashboardShell>
    </RequireAuth>
  );
}
