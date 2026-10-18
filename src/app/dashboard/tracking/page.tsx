"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { BookingBadge } from "@/components/status-badge";
import { WorkspaceLoading } from "@/components/loading";
import { DataTable, PageHeader, StatCard, ViewLink, formatDate } from "@/components/ui";
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
  const { currentUser, bookings, trucks, users } = useIbanga();
  if (!currentUser) return <WorkspaceLoading />;
  const rows = visibleBookings(currentUser, bookings, trucks).filter((booking) => liveStatuses.has(booking.status));
  const countByStatus = (status: Booking["status"]) => rows.filter((booking) => booking.status === status).length;

  return (
    <RequireAuth>
      <DashboardShell role={currentUser.role as Role}>
        <PageHeader
          eyebrow="Cargo"
          title="Live location"
          subtitle="Follow cargo you are allowed to see. Positions are recorded at least every 2 km, with departure and rest times on the same trail."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
              <circle cx="12" cy="10" r="2.4" />
            </svg>
          }
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Cargo on the road" value={rows.length} hint="Live shipments" />
          <StatCard label="Awaiting pickup" value={countByStatus("ACCEPTED")} hint="Truck confirmed" />
          <StatCard label="In transit" value={countByStatus("IN_PROGRESS")} hint="Moving now" />
          <StatCard label="Delivered" value={countByStatus("DELIVERED")} hint="Awaiting confirmation" />
        </div>

        <div className="mt-5">
          <DataTable
            columns={[
              { label: "Route" },
              { label: "Cargo" },
              { label: "Truck" },
              { label: "Importer" },
              { label: "Pickup date" },
              { label: "Status" },
              { label: "Actions", className: "text-right" },
            ]}
            emptyMessage="No cargo is on the road for your account right now."
            filterLabel="All cargo statuses"
            exportName="ibanga-live-cargo"
            rows={rows.map((booking) => {
              const truck = trucks.find((item) => item.id === booking.truckId);
              const importer = users.find((item) => item.id === booking.importerId);
              const route = `${booking.pickupLocation} to ${booking.destination}`;
              return {
                id: booking.id,
                searchText: `${route} ${booking.cargoType} ${truck?.plateNumber ?? ""} ${importer?.name ?? ""}`,
                filterValue: booking.status,
                exportValues: [route, `${booking.cargoType} · ${booking.cargoWeight}`, truck?.plateNumber ?? "", importer?.name ?? "", formatDate(booking.pickupDate), booking.status, ""],
                cells: [
                  <span key={`${booking.id}-route`}>
                    <strong className="block">{route}</strong>
                    <span className="text-xs text-muted">{booking.payment?.status === "HELD" ? "Payment held" : booking.payment?.status ?? "Payment"}</span>
                  </span>,
                  <span key={`${booking.id}-cargo`} className="min-w-40">
                    <strong className="block">{booking.cargoType}</strong>
                    <span className="text-xs text-muted">{booking.cargoWeight}</span>
                  </span>,
                  truck?.plateNumber ?? "—",
                  importer?.name ?? "—",
                  formatDate(booking.pickupDate),
                  <BookingBadge key={`${booking.id}-status`} status={booking.status} />,
                  <div key={`${booking.id}-action`} className="flex justify-end">
                    <ViewLink href={`/dashboard/tracking/${booking.id}`} label={`Track cargo ${route}`} />
                  </div>,
                ],
              };
            })}
          />
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
