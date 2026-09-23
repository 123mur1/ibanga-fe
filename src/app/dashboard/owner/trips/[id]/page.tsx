"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { BookingBadge } from "@/components/status-badge";
import { PriceAgree } from "@/components/price-agree";
import { Avatar } from "@/components/photos";
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
          <p className="rounded-2xl border border-line bg-card px-5 py-8 text-center text-muted shadow-soft">
            Booking not found.
          </p>
        ) : (
          <div className="max-w-3xl">
            <Link
              href="/dashboard/owner/requests"
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
              Requests
            </Link>

            <div className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-brand-dark to-brand p-6 shadow-card sm:p-8">
              <div className="paper-grid absolute inset-0 opacity-30" />
              <div
                aria-hidden="true"
                className="absolute -right-12 -top-16 h-44 w-44 rounded-full border-[18px] border-white/10"
              />
              <div className="relative flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    {booking.status === "PENDING" ? "New request" : "Trip"}
                  </p>
                  <h1 className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-2xl leading-tight text-white sm:text-3xl">
                    {booking.pickupLocation}
                    <svg className="shrink-0 text-accent" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                    {booking.destination}
                  </h1>
                  <p className="mt-2 text-sm text-white/75">
                    {truck ? `${truck.plateNumber} · ${truck.truckType}` : "Truck"} ·{" "}
                    {booking.cargoType}
                  </p>
                </div>
                <div className="shrink-0 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/20 backdrop-blur-sm">
                  <p className="text-center text-xs text-white/70">Status</p>
                  <div className="mt-1">
                    <BookingBadge status={booking.status} />
                  </div>
                </div>
              </div>
            </div>

            <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
              <div className="group flex items-center gap-2.5 border-b border-line bg-background/60 px-5 py-3.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand transition duration-200 group-hover:scale-105 group-hover:bg-brand group-hover:text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M8 10.5h.01M16 10.5h.01M8 14h.01M16 14h.01" />
                  </svg>
                </span>
                <h2 className="font-display text-lg tracking-tight text-navy">
                  Load details
                </h2>
              </div>
              <dl className="grid gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-2">
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
              <div className="border-t border-line px-5 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Description
                </dt>
                <dd className="mt-1.5 text-navy">{booking.cargoDescription}</dd>
              </div>
            </section>

            {importer ? (
              <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                <div className="group flex items-center gap-2.5 border-b border-line bg-background/60 px-5 py-3.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand transition duration-200 group-hover:scale-105 group-hover:bg-brand group-hover:text-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="8" r="3.5" />
                      <path d="M5 20a7 7 0 0 1 14 0" />
                    </svg>
                  </span>
                  <h2 className="font-display text-lg tracking-tight text-navy">
                    Importer
                  </h2>
                </div>
                <div className="flex items-center gap-4 px-5 py-5">
                  <Avatar src={importer.photo ?? undefined} name={importer.name} size="md" />
                  <div>
                    <p className="font-medium text-navy">{importer.name}</p>
                    <p className="text-sm text-muted">{importer.phone}</p>
                  </div>
                </div>
              </section>
            ) : null}

            {booking.status === "PENDING" ? (
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-warn-soft px-4 py-3.5 text-sm font-medium text-warn ring-1 ring-warn/10">
                <svg className="mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4.5M12 16h.01" />
                </svg>
                This booking already made the truck unavailable. Agree a price,
                then accept to keep it locked or reject to make it available
                again.
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
                    className="group"
                    disabled={!booking.agreedPrice.trim()}
                    onClick={() => act("ACCEPTED")}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/20 transition duration-200 group-hover:scale-110">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    Accept booking
                  </PrimaryButton>
                  <GhostButton
                    type="button"
                    className="group transition hover:border-bad/30 hover:text-bad"
                    onClick={() => act("REJECTED")}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-bad-soft text-bad transition duration-200 group-hover:scale-110">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M6 6l12 12M18 6 6 18" />
                      </svg>
                    </span>
                    Reject — make truck available
                  </GhostButton>
                </>
              ) : null}
              {booking.status === "ACCEPTED" ? (
                <PrimaryButton
                  type="button"
                  className="group"
                  onClick={() => act("IN_PROGRESS")}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/20 transition duration-200 group-hover:scale-110">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m12 5 7 14-7-3.5L5 19 12 5Z" />
                    </svg>
                  </span>
                  Start trip
                </PrimaryButton>
              ) : null}
              {booking.status === "IN_PROGRESS" ? (
                <PrimaryButton
                  type="button"
                  className="group"
                  onClick={() => act("DELIVERED")}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/20 transition duration-200 group-hover:scale-110">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3.5 7h11m0 0 3 3m-3-3 3-3" />
                      <path d="M7 13.5h13.5m0 0-3-3m3 3-3 3" />
                      <path d="M20.5 4h0M3.5 20h0" />
                    </svg>
                  </span>
                  Mark delivered
                </PrimaryButton>
              ) : null}
            </div>

            {actionError ? (
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-bad-soft px-3.5 py-2 text-sm font-medium text-bad">
                {actionError}
              </p>
            ) : null}

            {booking.status === "REJECTED" ? (
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-good-soft px-4 py-3.5 text-sm font-medium text-good ring-1 ring-good/10">
                <svg className="mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8 12 3 3 5-6" />
                </svg>
                You rejected this request. The truck is available again.
              </div>
            ) : null}
            {booking.status === "DELIVERED" ? (
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-warn-soft px-4 py-3.5 text-sm font-medium text-warn ring-1 ring-warn/10">
                <svg className="mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4.5M12 16h.01" />
                </svg>
                Waiting for the importer to confirm receipt. Marking delivered
                does not free the truck.
              </div>
            ) : null}
            {booking.status === "DISPUTED" ? (
              <div className="mt-4 flex items-start gap-3 rounded-2xl bg-bad-soft px-4 py-3.5 text-sm font-medium text-bad ring-1 ring-bad/10">
                <svg className="mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3 2.5 20h19L12 3Z" />
                  <path d="M12 9.5V14M12 17.5h.01" />
                </svg>
                Importer reported a problem. The truck stays unavailable until
                admin resolves the dispute.
              </div>
            ) : null}
          </div>
        )}
      </DashboardShell>
    </RequireAuth>
  );
}