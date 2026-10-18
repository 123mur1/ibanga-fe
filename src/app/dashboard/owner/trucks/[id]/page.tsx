"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { useToast } from "@/components/toast";
import { TruckGallery } from "@/components/photos";
import { BookingBadge, TruckBadge } from "@/components/status-badge";
import { ConfirmDialog, GhostButton, PageHeader, StatCard, formatDate } from "@/components/ui";
import { formatRwf } from "@/lib/payments";
import { useIbanga } from "@/lib/store";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/types";

export default function OwnerTruckDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { currentUser, trucks, bookings, setAvailability, deleteTruck } = useIbanga();
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);

  const found = trucks.find((item) => item.id === id);
  const truck = found && found.ownerId === currentUser?.id ? found : undefined;
  const history = truck ? bookings.filter((booking) => booking.truckId === truck.id) : [];
  const activeBooking = history.find((booking) => ACTIVE_BOOKING_STATUSES.includes(booking.status));
  const earned = history.reduce(
    (sum, booking) => sum + (booking.payment && booking.payment.status !== "REFUNDED" ? booking.payment.ownerAmountRwf : 0),
    0,
  );

  async function toggleAvailability() {
    if (!truck) return;
    setBusy(true);
    const next = truck.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
    const error = await setAvailability(truck.id, next);
    setBusy(false);
    if (error) toast(error, "bad");
    else toast(next === "AVAILABLE" ? "Truck is available to importers again." : "Truck is paused and hidden from importers.", "good");
  }

  async function remove() {
    if (!truck) return;
    setBusy(true);
    const error = await deleteTruck(truck.id);
    setBusy(false);
    setRemoving(false);
    if (error) {
      toast(error, "bad");
      return;
    }
    toast(`Truck ${truck.plateNumber} was removed.`, "good");
    router.push("/dashboard/owner/trucks");
  }

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        <Link href="/dashboard/owner/trucks" className="group inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-dark">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand transition duration-200 group-hover:-translate-x-0.5 group-hover:bg-brand group-hover:text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 4-8 8 8 8" />
            </svg>
          </span>
          My trucks
        </Link>

        {!truck ? (
          <p className="mt-4 rounded-2xl border border-line bg-card px-5 py-10 text-center text-muted">This truck could not be found.</p>
        ) : (
          <>
            <div className="mt-4">
              <PageHeader
                eyebrow="Truck details"
                title={truck.plateNumber}
                subtitle={`${truck.truckType} · ${truck.capacity} tons · ${truck.currentLocation}`}
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
                    <circle cx="7.5" cy="17.5" r="1.8" />
                    <circle cx="17.5" cy="17.5" r="1.8" />
                  </svg>
                }
                actions={<TruckBadge status={truck.status} />}
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <StatCard label="Bookings" value={history.length} hint="All time on this truck" />
              <StatCard label="Price per booking" value={truck.priceRwf == null ? "Not set" : formatRwf(truck.priceRwf)} hint="Fixed listing price" accent="accent" />
              <StatCard label="Earned" value={formatRwf(earned)} hint="Your share, after commission" accent="good" />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,1fr)]">
              <div className="space-y-5">
                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-background/60 px-5 py-4">
                    <h2 className="font-display text-lg text-navy">Photos</h2>
                  </div>
                  <div className="p-5">
                    <TruckGallery photos={truck.photos} alt={truck.plateNumber} />
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-background/60 px-5 py-4">
                    <h2 className="font-display text-lg text-navy">Listing</h2>
                  </div>
                  <dl className="grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2">
                    <Item label="Plate number" value={truck.plateNumber} />
                    <Item label="Truck type" value={truck.truckType} />
                    <Item label="Capacity" value={`${truck.capacity} tons`} />
                    <Item label="Current location" value={truck.currentLocation || "—"} />
                    <Item label="Preferred route" value={truck.preferredRoute || "—"} />
                    <Item label="Price per booking" value={truck.priceRwf == null ? "Price not set" : formatRwf(truck.priceRwf)} />
                  </dl>
                  <div className="border-t border-line px-5 py-4">
                    <p className="text-sm font-medium text-muted">Description</p>
                    <p className="mt-1.5 text-navy">{truck.description || "No description added."}</p>
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-background/60 px-5 py-4">
                    <h2 className="font-display text-lg text-navy">Booking history</h2>
                  </div>
                  {history.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-muted">This truck has not been booked yet.</p>
                  ) : (
                    <ul className="divide-y divide-line">
                      {history.slice(0, 6).map((booking) => (
                        <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                          <div className="min-w-0">
                            <Link href={`/dashboard/owner/bookings/${booking.id}`} className="font-semibold text-navy hover:text-brand">
                              {booking.pickupLocation} to {booking.destination}
                            </Link>
                            <p className="text-sm text-muted">{booking.cargoType} · {formatDate(booking.pickupDate)}</p>
                          </div>
                          <BookingBadge status={booking.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              <aside className="space-y-5">
                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-brand px-5 py-4 text-white">
                    <h2 className="font-display text-lg">Manage truck</h2>
                    <p className="mt-1 text-sm text-white/80">Edit the listing, pause it or remove it.</p>
                  </div>
                  <div className="space-y-3 px-5 py-5">
                    <Link
                      href={`/dashboard/owner/trucks/${truck.id}/edit`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
                    >
                      Edit truck details
                    </Link>
                    <GhostButton
                      type="button"
                      className="w-full"
                      disabled={busy || (truck.status === "UNAVAILABLE" && Boolean(activeBooking))}
                      onClick={() => void toggleAvailability()}
                    >
                      {truck.status === "AVAILABLE" ? "Pause truck (make unavailable)" : activeBooking ? "On an active booking" : "Activate truck (make available)"}
                    </GhostButton>
                    <GhostButton
                      type="button"
                      className="w-full hover:border-bad/30 hover:text-bad"
                      disabled={busy || history.length > 0}
                      onClick={() => setRemoving(true)}
                    >
                      {history.length > 0 ? "Has bookings, cannot delete" : "Delete truck"}
                    </GhostButton>
                    {truck.status === "UNAVAILABLE" && activeBooking ? (
                      <p className="text-xs leading-5 text-muted">
                        This truck is held by a booking and becomes available again when the trip finishes or is rejected.
                      </p>
                    ) : null}
                  </div>
                </section>

                {activeBooking ? (
                  <section className="rounded-2xl border border-line bg-brand-soft/60 p-5">
                    <h3 className="font-display text-lg text-navy">Current booking</h3>
                    <p className="mt-2 font-semibold text-navy">{activeBooking.pickupLocation} to {activeBooking.destination}</p>
                    <p className="text-sm text-muted">{activeBooking.cargoType} · {activeBooking.cargoWeight}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <BookingBadge status={activeBooking.status} />
                      <Link href={`/dashboard/owner/bookings/${activeBooking.id}`} className="text-sm font-semibold text-brand hover:text-brand-dark">
                        View booking
                      </Link>
                    </div>
                  </section>
                ) : null}

                <Link href={`/trucks/${truck.id}`} className="block text-center text-sm font-semibold text-brand hover:text-brand-dark">
                  See how importers view this listing
                </Link>
              </aside>
            </div>

            {removing ? (
              <ConfirmDialog
                title="Delete truck"
                message={`Delete truck ${truck.plateNumber}? This cannot be undone.`}
                confirmLabel="Delete truck"
                tone="danger"
                busy={busy}
                onConfirm={() => void remove()}
                onCancel={() => !busy && setRemoving(false)}
              />
            ) : null}
          </>
        )}
      </DashboardShell>
    </RequireAuth>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold text-navy">{value}</dd>
    </div>
  );
}
