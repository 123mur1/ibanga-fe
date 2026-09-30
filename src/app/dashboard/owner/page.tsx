"use client";

import Link from "next/link";
import { useEffect } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { BookingBadge, TruckBadge } from "@/components/status-badge";
import { TruckThumb } from "@/components/photos";
import { StatCard } from "@/components/ui";
import { useIbanga } from "@/lib/store";

export default function OwnerDashboard() {
  const { currentUser, trucks, trucksLoading, bookings, refreshTrucks } = useIbanga();
  const mine = trucks;
  const firstName = (currentUser?.name ?? "").split(" ")[0] || "there";

  useEffect(() => {
    if (currentUser) refreshTrucks({ mine: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const myBookings = bookings.filter((b) =>
    mine.some((t) => t.id === b.truckId),
  );
  const requests = myBookings.filter((b) => b.status === "PENDING");
  const active = myBookings.filter((b) =>
    ["ACCEPTED", "IN_PROGRESS", "DELIVERED"].includes(b.status),
  );
  const available = mine.filter((t) => t.status === "AVAILABLE");
  const recentTrips = [...active, ...requests].slice(0, 4);

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-navy via-brand-dark to-brand p-5 shadow-card sm:p-6">
          <div className="paper-grid absolute inset-0 opacity-30" />
          <div
            aria-hidden="true"
            className="absolute -left-14 -top-20 h-56 w-56 rounded-full border-22 border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-28 right-20 h-48 w-48 rounded-full border-18 border-accent/30"
          />
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Workspace
              </p>
              <h1 className="mt-2 font-display text-2xl leading-tight text-white sm:text-3xl">
                Welcome back, {firstName}.
              </h1>
              <p className="mt-2 text-sm text-white/80">
                {requests.length
                  ? "You have requests to review — accepting keeps the truck locked for the trip."
                  : available.length === mine.length && mine.length
                  ? "All your trucks are available on the market. Find cargo to move."
                  : "Keep your fleet honest: update trip status as you go."}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/owner/trucks/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add a truck
                </Link>
                <Link
                  href="/dashboard/owner/requests"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Review requests
                  {requests.length ? (
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand-dark">
                      {requests.length}
                    </span>
                  ) : null}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/20 backdrop-blur-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white [&_svg]:h-4 [&_svg]:w-4">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
                  <circle cx="7.5" cy="17.5" r="1.8" />
                  <circle cx="17.5" cy="17.5" r="1.8" />
                </svg>
              </span>
              <div>
                <p className="font-display text-2xl leading-none text-white">
                  {available.length}/{mine.length}
                </p>
                <p className="mt-1 text-xs text-white/70">trucks available</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="My trucks"
            value={mine.length}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
                <circle cx="7.5" cy="17.5" r="1.8" />
                <circle cx="17.5" cy="17.5" r="1.8" />
              </svg>
            }
            accent="brand"
          />
          <StatCard
            label="Available now"
            value={available.length}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            }
            accent="good"
          />
          <StatCard
            label="Pending requests"
            value={requests.length}
            hint="Review now"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 13h5l1.5 2.5h5L16 13h5" />
                <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
              </svg>
            }
            accent="warn"
          />
          <StatCard
            label="Active trips"
            value={active.length}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="6" cy="19" r="2.5" />
                <circle cx="18" cy="5" r="2.5" />
                <path d="M8.5 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
              </svg>
            }
            accent="accent"
          />
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl tracking-tight text-navy">
                  Fleet
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Your trucks and their current availability.
                </p>
              </div>
              {mine.length ? (
                <Link
                  href="/dashboard/owner/trucks"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  Manage
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              ) : null}
            </div>
            <div className="mt-4 space-y-3">
              {trucksLoading ? (
                <p className="text-sm text-muted">Loading your trucks…</p>
              ) : mine.length ? (
                mine.slice(0, 4).map((truck) => (
                  <Link
                    key={truck.id}
                    href={`/dashboard/owner/trucks/${truck.id}/edit`}
                    className="group flex items-center gap-4 rounded-2xl border border-line bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-card"
                  >
                    <TruckThumb
                      photos={truck.photos}
                      alt={truck.plateNumber}
                      className="aspect-square h-14 w-14 shrink-0 rounded-xl sm:aspect-4/3 sm:h-16 sm:w-24"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-navy">
                        {truck.plateNumber} · {truck.truckType}
                      </p>
                      <p className="truncate text-sm text-muted">
                        {truck.preferredRoute} · {truck.capacity} tons
                      </p>
                    </div>
                    <TruckBadge status={truck.status} />
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-10 text-center">
                  <p className="font-display text-lg text-navy">No trucks listed</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                    Your fleet starts empty. Add your first truck and make it
                    visible to importers.
                  </p>
                  <Link
                    href="/dashboard/owner/trucks/new"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-card"
                  >
                    Add your first truck
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl tracking-tight text-navy">
                Recent activity
              </h2>
              {recentTrips.length ? (
                <Link
                  href="/dashboard/owner/trips"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  Trips
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              ) : null}
            </div>
            <div className="mt-4 space-y-3">
              {recentTrips.length ? (
                recentTrips.map((booking) => {
                  const truck = mine.find((t) => t.id === booking.truckId);
                  return (
                    <Link
                      key={booking.id}
                      href={`/dashboard/owner/trips/${booking.id}`}
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-card"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy">
                          {booking.pickupLocation} → {booking.destination}
                        </p>
                        <p className="truncate text-sm text-muted">
                          {truck?.plateNumber} · {booking.cargoWeight}
                        </p>
                      </div>
                      <BookingBadge status={booking.status} />
                    </Link>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-10 text-center">
                  <p className="font-display text-lg text-navy">All quiet here</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                    Pending requests and active trips will appear here as
                    importers book your trucks.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}