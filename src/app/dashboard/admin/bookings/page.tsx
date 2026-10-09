"use client";

import { BookingBadge } from "@/components/status-badge";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { DataTable, PageHeader, StatCard, formatDate, inputClass } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import type { BookingStatus } from "@/lib/types";

export default function AdminBookingsPage() {
  const { bookings, trucks, users, setBookingStatus } = useIbanga();
  const statuses: BookingStatus[] = ["PENDING", "ACCEPTED", "IN_PROGRESS", "DELIVERED", "COMPLETED", "DISPUTED", "REJECTED"];

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <PageHeader
          eyebrow="Marketplace"
          title="Bookings"
          subtitle="Every freight request across the marketplace, newest first."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2.5" />
              <path d="M3 9.5h18M8 3v4m8-4v4" />
            </svg>
          }
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total bookings" value={bookings.length} hint="Across all roles" />
          <StatCard label="In progress" value={bookings.filter((booking) => booking.status === "IN_PROGRESS").length} hint="Currently moving" accent="accent" />
          <StatCard label="Completed" value={bookings.filter((booking) => booking.status === "COMPLETED").length} hint="Delivered and closed" accent="good" />
        </div>
        <div className="mt-5">
          <DataTable
            columns={[{ label: "Route" }, { label: "Importer" }, { label: "Truck" }, { label: "Pickup" }, { label: "Cargo" }, { label: "Status" }, { label: "Manage", className: "text-right" }]}
            filterLabel="All booking statuses"
            rows={bookings.map((booking) => {
              const truck = trucks.find((item) => item.id === booking.truckId);
              const importer = users.find((item) => item.id === booking.importerId);
              const route = `${booking.pickupLocation} to ${booking.destination}`;
              return {
                id: booking.id,
                searchText: `${route} ${importer?.name ?? ""} ${truck?.plateNumber ?? ""} ${booking.cargoType}`,
                filterValue: booking.status,
                exportValues: [route, importer?.name ?? "", truck?.plateNumber ?? "", formatDate(booking.pickupDate), booking.cargoType, booking.status, ""],
                cells: [
                  <span key={`${booking.id}-route`} className="font-semibold">{route}</span>,
                  importer?.name ?? "—",
                  truck?.plateNumber ?? "—",
                  formatDate(booking.pickupDate),
                  `${booking.cargoType} · ${booking.cargoWeight}`,
                  <span key={`${booking.id}-status`}><BookingBadge status={booking.status} /></span>,
                  <select
                    key={`${booking.id}-manage`}
                    aria-label={`Update booking status for ${booking.id}`}
                    className={`${inputClass} min-w-36 py-2`}
                    value={booking.status}
                    onChange={(event) => void setBookingStatus(booking.id, event.target.value as BookingStatus)}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                    ))}
                  </select>,
                ],
              };
            })}
          />
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}