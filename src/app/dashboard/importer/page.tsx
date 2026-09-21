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

  return (
    <RequireAuth role="IMPORTER">
      <DashboardShell role="IMPORTER">
        <h1 className="font-display text-3xl text-navy">
          Hello, {currentUser?.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-muted">
          Book a truck to hold it, agree the price, then wait for the owner to
          accept or reject.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Open requests" value={pending} />
          <StatCard label="Active trips" value={active} />
          <StatCard
            label="Waiting for you"
            value={toConfirm.length}
            hint="Confirm delivery"
          />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/trucks"
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
          >
            Find a truck
          </Link>
          <Link
            href="/dashboard/importer/bookings"
            className="rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold"
          >
            All bookings
          </Link>
        </div>
        <h2 className="mt-10 font-display text-xl text-navy">Needs attention</h2>
        <div className="mt-3 space-y-3">
          {(toConfirm.length ? toConfirm : mine.slice(0, 3)).map((booking) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              truck={trucks.find((t) => t.id === booking.truckId)}
              href={`/dashboard/importer/bookings/${booking.id}`}
            />
          ))}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
