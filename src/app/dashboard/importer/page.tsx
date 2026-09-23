"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { BookingRow } from "@/components/booking-row";
import { StatCard } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import Link from "next/link";

export default function ImporterHome() {
  const { currentUser, bookings, trucks } = useIbanga();
  const mine = bookings.filter((b) => b.importerId === currentUser?.id);
  const pending = mine.filter((b) => b.status === "PENDING").length;
  const active = mine.filter((b) =>
    ["ACCEPTED", "IN_PROGRESS", "DELIVERED"].includes(b.status),
  ).length;
  const toConfirm = mine.filter((b) => b.status === "DELIVERED");
  const firstName = (currentUser?.name ?? "").split(" ")[0] || "there";
  const highlight = toConfirm.length ? toConfirm : mine.slice(0, 3);

  return (
    <RequireAuth role="IMPORTER">
      <DashboardShell role="IMPORTER">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-brand-dark to-navy p-5 shadow-card sm:p-6">
          <div className="paper-grid absolute inset-0 opacity-30" />
          <div
            aria-hidden="true"
            className="absolute -right-14 -top-20 h-56 w-56 rounded-full border-[22px] border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-28 left-1/3 h-48 w-48 rounded-full border-[18px] border-accent/30"
          />
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Workspace
              </p>
              <h1 className="mt-2 font-display text-2xl leading-tight text-white sm:text-3xl">
                Hello, {firstName}.
              </h1>
              <p className="mt-2 text-sm text-white/80">
                {toConfirm.length
                  ? "Some deliveries are waiting on your confirmation — let the trucks back to work."
                  : pending
                  ? "You have pending requests. Track them here while owners decide."
                  : "Find an available truck, book it, and agree the price directly with the owner."}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/trucks"
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
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="m20 20-3.8-3.8" />
                  </svg>
                  Find a truck
                </Link>
                <Link
                  href="/dashboard/importer/bookings"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  My bookings
                  {pending ? (
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand-dark">
                      {pending}
                    </span>
                  ) : null}
                </Link>
              </div>
            </div>
            {active || pending ? (
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
                    <circle cx="6" cy="19" r="2.5" />
                    <circle cx="18" cy="5" r="2.5" />
                    <path d="M8.5 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
                  </svg>
                </span>
                <div>
                  <p className="font-display text-2xl leading-none text-white">
                    {active + pending}
                  </p>
                  <p className="mt-1 text-xs text-white/70">
                    trips in motion
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Open requests"
            value={pending}
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
            value={active}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="6" cy="19" r="2.5" />
                <circle cx="18" cy="5" r="2.5" />
                <path d="M8.5 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
              </svg>
            }
            accent="brand"
          />
          <StatCard
            label="Waiting for you"
            value={toConfirm.length}
            hint="Confirm delivery"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            }
            accent="good"
          />
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl tracking-tight text-navy">
              {toConfirm.length ? "Needs your confirmation" : "Recent activity"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {toConfirm.length
                ? "Confirm delivery to complete the trip and free the truck."
                : "Your most recent bookings and their progress."}
            </p>
          </div>
          {mine.length ? (
            <Link
              href="/dashboard/importer/bookings"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark"
            >
              View all
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          ) : null}
        </div>
        <div className="mt-4 space-y-3">
          {highlight.length ? (
            highlight.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                truck={trucks.find((t) => t.id === booking.truckId)}
                href={`/dashboard/importer/bookings/${booking.id}`}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
              <p className="font-display text-lg text-navy">No bookings yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Find an available truck, call the owner, and submit a request —
                the truck locks for you right away.
              </p>
              <Link
                href="/trucks"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-card"
              >
                Browse trucks
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}