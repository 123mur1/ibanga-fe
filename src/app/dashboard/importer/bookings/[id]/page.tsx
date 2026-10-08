"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { BookingBadge } from "@/components/status-badge";
import { Avatar } from "@/components/photos";
import { LiveTripTracking } from "@/components/live-trip-tracking";
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
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentPending, setPaymentPending] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  async function payForBooking() {
    if (!booking || paymentPending) return;
    setPaymentPending(true);
    setPaymentError(null);
    try {
      await api(`/wallet/bookings/${booking.id}/pay`, { method: "POST" });
      setPaymentConfirmed(true);
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "Could not pay for this booking.",
      );
    } finally {
      setPaymentPending(false);
    }
  }

  return (
    <RequireAuth role="IMPORTER">
      <DashboardShell role="IMPORTER">
        {!booking ? (
          <p className="rounded-2xl border border-line bg-card px-5 py-8 text-center text-muted shadow-soft">
            Booking not found.
          </p>
        ) : (
          <div className="max-w-3xl">
            <Link
              href="/dashboard/importer/bookings"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-dark"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand transition duration-200 group-hover:-translate-x-0.5 group-hover:bg-brand group-hover:text-white">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m15 4-8 8 8 8" />
                </svg>
              </span>
              My bookings
            </Link>

            <div className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-brand-dark to-navy p-6 shadow-card sm:p-8">
              <div className="paper-grid absolute inset-0 opacity-30" />
              <div
                aria-hidden="true"
                className="absolute -right-12 -top-16 h-44 w-44 rounded-full border-[18px] border-white/10"
              />
              <div className="relative flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    Booking
                  </p>
                  <h1 className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-2xl leading-tight text-white sm:text-3xl">
                    {booking.pickupLocation}
                    <svg className="shrink-0 text-accent" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                    {booking.destination}
                  </h1>
                  <p className="mt-2 text-sm text-white/75">
                    {booking.cargoType} · {booking.cargoWeight}
                  </p>
                </div>
                <div className="shrink-0 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/20 backdrop-blur-sm">
                  <p className="text-center text-xs text-white/70">Status</p>
                  <div className="mt-1">
                    <BookingBadge status={booking.status} />
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>

            <LiveTripTracking
              bookingId={booking.id}
              status={booking.status}
              canShare={false}
            />

            <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
              <div className="group flex items-center gap-2.5 border-b border-line bg-background/60 px-5 py-3.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand transition duration-200 group-hover:scale-105 group-hover:bg-brand group-hover:text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M8 10.5h.01M16 10.5h.01M8 14h.01M16 14h.01" />
                  </svg>
                </span>
                <h2 className="font-display text-lg tracking-tight text-navy">
                  Journey details
                </h2>
              </div>
              <dl className="grid gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Cargo type
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
                    Pickup date
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
              <div className="border-t border-line px-5 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Description
                </dt>
                <dd className="mt-1.5 text-navy">{booking.cargoDescription}</dd>
              </div>
              {booking.additionalInstructions ? (
                <div className="border-t border-line px-5 py-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Instructions
                  </dt>
                  <dd className="mt-1.5 text-sm text-muted">
                    {booking.additionalInstructions}
                  </dd>
                </div>
              ) : null}
            </section>

            {truck && owner ? (
              <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                <div className="group flex items-center gap-2.5 border-b border-line bg-background/60 px-5 py-3.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand transition duration-200 group-hover:scale-105 group-hover:bg-brand group-hover:text-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
                      <circle cx="7.5" cy="17.5" r="1.8" />
                      <circle cx="17.5" cy="17.5" r="1.8" />
                    </svg>
                  </span>
                  <h2 className="font-display text-lg tracking-tight text-navy">
                    Truck &amp; owner
                  </h2>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
                  <div className="flex items-center gap-4">
                    <Avatar src={owner.photo ?? undefined} name={owner.name} size="md" />
                    <div>
                      <p className="font-semibold text-navy">
                        {truck.plateNumber} · {truck.truckType}
                      </p>
                      <p className="text-sm text-muted">
                        {owner.name} · {owner.phone}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/trucks/${truck.id}`}
                    className="group inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-dark"
                  >
                    View truck profile
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-soft text-brand transition duration-200 group-hover:translate-x-0.5 group-hover:bg-brand group-hover:text-white">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </Link>
                </div>
              </section>
            ) : null}

            <section className="mt-4 rounded-2xl border border-line bg-card px-5 py-4 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Truck listing price
                  </p>
                  <p className="mt-1 font-display text-2xl text-navy">
                    {booking.agreedPriceRwf == null
                      ? "Price unavailable"
                      : `RWF ${booking.agreedPriceRwf.toLocaleString("en-RW")}`}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    The 6% platform commission is deducted from the owner&apos;s proceeds.
                  </p>
                </div>
                {booking.payment ? (
                  <span className="rounded-full bg-good-soft px-3 py-1 text-xs font-semibold text-good">
                    {booking.payment.status === "RELEASED"
                      ? "Paid and released"
                      : booking.payment.status === "FUNDED"
                        ? "Payment held"
                        : booking.payment.status}
                  </span>
                ) : null}
              </div>
              {booking.status === "ACCEPTED" &&
              !booking.payment &&
              !paymentConfirmed ? (
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                  <PrimaryButton
                    type="button"
                    disabled={paymentPending || !booking.agreedPriceRwf}
                    onClick={payForBooking}
                  >
                    {paymentPending ? "Processing…" : "Pay from wallet"}
                  </PrimaryButton>
                  <Link
                    href="/dashboard/wallet"
                    className="text-sm font-semibold text-brand hover:text-brand-dark"
                  >
                    Add wallet funds
                  </Link>
                </div>
              ) : null}
              {paymentConfirmed ? (
                <p className="mt-3 text-sm font-medium text-good" role="status">
                  Payment is held. The owner can now start the trip.
                </p>
              ) : null}
              {paymentError ? (
                <p className="mt-3 text-sm font-medium text-bad" role="alert">
                  {paymentError}
                </p>
              ) : null}
            </section>

            {booking.status === "PENDING" ? (
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-warn-soft px-4 py-3.5 text-sm font-medium text-warn ring-1 ring-warn/10">
                <svg className="mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4.5M12 16h.01" />
                </svg>
                The truck&apos;s listed price is fixed for this booking. The owner
                can accept or reject your request. After acceptance, pay from
                your wallet before the trip begins.
              </div>
            ) : null}

            {booking.status === "REJECTED" ? (
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-good-soft px-4 py-3.5 text-sm font-medium text-good ring-1 ring-good/10">
                <svg className="mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8 12 3 3 5-6" />
                </svg>
                The owner rejected this request. The truck is available again.
              </div>
            ) : null}

            {booking.status === "DELIVERED" ||
            (booking.status === "DISPUTED" && booking.dispute?.status === "RESOLVED") ? (
              <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                <div className="flex items-center gap-2.5 border-b border-line bg-good-soft/50 px-5 py-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-good-soft text-good">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <p className="font-display text-lg tracking-tight text-navy">
                    {booking.status === "DELIVERED"
                      ? "Goods marked delivered"
                      : "Admin review complete"}
                  </p>
                </div>
                <div className="space-y-4 px-5 py-5">
                  <p className="text-sm text-muted">
                    {booking.status === "DELIVERED"
                      ? "Check the cargo. Confirming receipt completes the trip, releases the held funds, and makes the truck available again. Reporting a problem keeps the funds held until the review is complete and you confirm receipt."
                      : "The admin has completed the review. Confirm receipt to release the held funds to the owner and make the truck available again."}
                  </p>
                  <PrimaryButton
                    type="button"
                    className="group"
                    onClick={async () => {
                      const error = await setBookingStatus(booking.id, "COMPLETED");
                      setMessage(error ?? "Receipt confirmed. Trip completed.");
                    }}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/20 transition duration-200 group-hover:scale-110">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    Confirm receipt
                  </PrimaryButton>
                  {booking.status === "DELIVERED" ? (
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
                      className="group transition hover:border-bad/30 hover:text-bad"
                      onClick={async () => {
                        if (!reason.trim()) {
                          setMessage("Please describe the problem.");
                          return;
                        }
                        const error = await reportProblem(booking.id, reason.trim());
                        setMessage(error ?? "Dispute opened. Admin will review.");
                      }}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-bad-soft text-bad transition duration-200 group-hover:scale-110">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 3 2.5 20h19L12 3Z" />
                          <path d="M12 9.5V14M12 17.5h.01" />
                        </svg>
                      </span>
                      Report problem
                    </GhostButton>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {message ? (
              <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-good-soft px-3.5 py-2 text-sm font-medium text-good">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8 12 3 3 5-6" />
                </svg>
                {message}
              </p>
            ) : null}
          </div>
        )}
      </DashboardShell>
    </RequireAuth>
  );
}