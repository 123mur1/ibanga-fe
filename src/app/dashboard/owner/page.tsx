"use client";

import Link from "next/link";
import { useEffect } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { TruckBadge } from "@/components/status-badge";
import { StatCard } from "@/components/ui";
import { useIbanga } from "@/lib/store";

export default function OwnerDashboard() {
  const { currentUser, trucks, trucksLoading, bookings, refreshTrucks } = useIbanga();
  const mine = trucks;

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

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight text-navy">
              Owner dashboard
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              List trucks, answer requests, and keep trip status honest. Price
              talks stay off iBanga.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/owner/trucks/new"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-card"
            >
              Add truck
            </Link>
            <Link
              href="/dashboard/owner/requests"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-soft transition hover:-translate-y-0.5 hover:border-navy/20"
            >
              Review requests
            </Link>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="My trucks" value={mine.length} />
          <StatCard
            label="Available"
            value={mine.filter((t) => t.status === "AVAILABLE").length}
          />
          <StatCard label="Pending requests" value={requests.length} />
          <StatCard label="Active trips" value={active.length} />
        </div>
        {trucksLoading ? (
          <p className="mt-5 text-sm text-muted">Loading your trucks…</p>
        ) : null}
        <h2 className="mt-10 font-display text-xl tracking-tight text-navy">
          Fleet
        </h2>
        <div className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
          {mine.map((truck) => (
            <div
              key={truck.id}
              className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-background/50"
            >
              <div>
                <p className="font-semibold text-navy">
                  {truck.plateNumber} · {truck.truckType}
                </p>
                <p className="text-sm text-muted">{truck.preferredRoute}</p>
              </div>
              <div className="flex items-center gap-2">
                {truck.status !== "AVAILABLE" ? (
                  <span className="text-xs font-medium text-accent">
                    On a trip
                  </span>
                ) : null}
                <TruckBadge status={truck.status} />
              </div>
            </div>
          ))}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
