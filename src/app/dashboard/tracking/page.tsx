"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { BookingBadge } from "@/components/status-badge";
import { WorkspaceLoading } from "@/components/loading";
import { PageHeader } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import type { Booking, Role, Truck, User } from "@/lib/types";

function visibleBookings(user: User, bookings: Booking[], trucks: Truck[]) {
  if (user.role === "ADMIN") return bookings;
  if (user.role === "IMPORTER") return bookings.filter((booking) => booking.importerId === user.id);
  const owned = new Set(trucks.map((truck) => truck.id));
  return bookings.filter((booking) => owned.has(booking.truckId));
}

const liveStatuses = new Set(["ACCEPTED", "IN_PROGRESS", "DELIVERED"]);

export default function TrackingIndexPage() {
  const { currentUser, bookings, trucks } = useIbanga();
  if (!currentUser) return <WorkspaceLoading />;
  const rows = visibleBookings(currentUser, bookings, trucks).filter((booking) => liveStatuses.has(booking.status));

  return (
    <RequireAuth>
      <DashboardShell role={currentUser.role as Role}>
        <PageHeader
          eyebrow="Cargo"
          title="Live location"
          subtitle="Follow cargo you are allowed to see. Positions are recorded at least every 2 km, with departure and rest times on the same trail."
        />
        <div className="mt-6 grid gap-3">
          {rows.length === 0 ? (
            <p className="rounded-2xl border border-line bg-card px-5 py-8 text-center text-muted">No cargo is on the road for your account right now.</p>
          ) : rows.map((booking) => {
            const truck = trucks.find((item) => item.id === booking.truckId);
            return (
              <Link key={booking.id} href={`/dashboard/tracking/${booking.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card px-5 py-4 shadow-soft hover:border-brand/30">
                <div>
                  <p className="font-semibold text-navy">{booking.pickupLocation} to {booking.destination}</p>
                  <p className="mt-1 text-sm text-muted">{booking.cargoType} · {truck?.plateNumber ?? "Truck"} · {booking.payment?.status === "HELD" ? "Payment held" : booking.payment?.status ?? "Payment"}</p>
                </div>
                <BookingBadge status={booking.status} />
              </Link>
            );
          })}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
