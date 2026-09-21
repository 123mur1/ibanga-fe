"use client";

import Link from "next/link";
import { useEffect } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { TruckBadge } from "@/components/status-badge";
import { StatCard } from "@/components/ui";
import { useIbanga } from "@/lib/store";

export default function OwnerDashboard() {
  const { currentUser, trucks, bookings, refreshTrucks } = useIbanga();
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
        <h1 className="font-display text-3xl text-navy">Owner dashboard</h1>
        <p className="mt-1 text-muted">
          List trucks, answer requests, and keep trip status honest. Price talks
          stay off iBanga.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <StatCard label="My trucks" value={mine.length} />
          <StatCard
            label="Available"
            value={mine.filter((t) => t.status === "AVAILABLE").length}
          />
          <StatCard label="Pending requests" value={requests.length} />
          <StatCard label="Active trips" value={active.length} />
        </div>
        <div className="mt-8 flex gap-3">
          <Link
            href="/dashboard/owner/trucks/new"
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
          >
            Add truck
          </Link>
          <Link
            href="/dashboard/owner/requests"
            className="rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold"
          >
            Review requests
          </Link>
        </div>
        <h2 className="mt-10 font-display text-xl text-navy">Fleet</h2>
        <div className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
          {mine.map((truck) => (
            <div
              key={truck.id}
              className="flex items-center justify-between gap-3 px-5 py-4"
            >
              <div>
                <p className="font-semibold text-navy">
                  {truck.plateNumber} · {truck.truckType}
                </p>
                <p className="text-sm text-muted">{truck.preferredRoute}</p>
              </div>
              <TruckBadge status={truck.status} />
            </div>
          ))}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
