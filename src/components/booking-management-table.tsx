"use client";

import Link from "next/link";
import { BookingBadge } from "@/components/status-badge";
import { DataTable, StatCard, ViewLink, formatDate, formatDateTime } from "@/components/ui";
import { useOps } from "@/hooks/use-ops";
import type { Booking, Truck, User } from "@/lib/types";

export function BookingManagementTable({
  bookings,
  trucks,
  users,
  counterparty,
  detailPath,
  listHref,
  showStats = true,
}: {
  bookings: Booking[];
  trucks: Truck[];
  users: User[];
  counterparty: "IMPORTER" | "TRUCK_OWNER";
  detailPath: (booking: Booking) => string;
  listHref: string;
  showStats?: boolean;
}) {
  const { drivers, driverAssignments, shipments } = useOps();
  const activeCount = bookings.filter((booking) => ["ACCEPTED", "IN_PROGRESS", "DELIVERED"].includes(booking.status)).length;
  const pendingCount = bookings.filter((booking) => booking.status === "PENDING").length;
  const completedCount = bookings.filter((booking) => booking.status === "COMPLETED").length;

  return (
    <>
      {showStats ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total records" value={bookings.length} hint="Your booking activity" href={listHref} />
          <StatCard label="Needs attention" value={pendingCount} hint="Pending decisions" accent="warn" href={`${listHref}?status=PENDING`} />
          <StatCard label="Active trips" value={activeCount} hint="In the delivery cycle" accent="accent" href={`${listHref}?status=ACCEPTED,IN_PROGRESS,DELIVERED`} />
          <StatCard label="Completed" value={completedCount} hint="Closed successfully" accent="good" href={`${listHref}?status=COMPLETED`} />
        </div>
      ) : null}
      <div className="mt-5">
        <DataTable
          columns={[{ label: "Route" }, { label: counterparty === "IMPORTER" ? "Truck owner" : "Importer" }, { label: "Vehicle" }, { label: "Associated driver" }, { label: "Pickup" }, { label: "Cargo" }, { label: "Paid" }, { label: "Amount" }, { label: "Payment" }, { label: "Status" }, { label: "Details" }]}
          filterLabel="All booking statuses"
          extraFilterLabel="All payment states"
          exportName="ibanga-bookings"
          rows={bookings.map((booking) => {
            const truck = trucks.find((item) => item.id === booking.truckId);
            const partyId = counterparty === "IMPORTER" ? truck?.ownerId : booking.importerId;
            const person = users.find((user) => user.id === partyId);
            const assignment = driverAssignments.find((item) => item.bookingId === booking.id && item.status === "ACTIVE") ?? driverAssignments.find((item) => item.bookingId === booking.id && item.status === "UPCOMING");
            const shipment = shipments.find((item) => item.bookingId === booking.id);
            const driver = drivers.find((item) => item.id === assignment?.driverId) ?? drivers.find((item) => item.id === shipment?.driverId) ?? drivers.find((item) => item.assignedTruckId === booking.truckId);
            const route = `${booking.pickupLocation} to ${booking.destination}`;
            return {
              id: booking.id,
              searchText: `${route} ${person?.name ?? ""} ${truck?.plateNumber ?? ""} ${driver?.name ?? ""} ${booking.cargoType} ${booking.status} ${booking.payment?.receiptNumber ?? ""}`,
              filterValue: booking.status,
              extraFilterValue: booking.payment?.status,
              exportValues: [route, person?.name ?? "", truck?.plateNumber ?? "", driver?.name ?? "Unassigned", formatDate(booking.pickupDate), `${booking.cargoType} ${booking.cargoWeight}`, booking.payment ? formatDateTime(booking.payment.paidAt) : "", booking.payment ? String(booking.payment.amountRwf) : "", booking.payment?.status ?? "", booking.status, ""],
              cells: [
                <span key={`${booking.id}-route`} className="font-semibold">{route}</span>,
                person?.name ?? "—",
                truck?.plateNumber ?? "—",
                driver?.name ?? <span className="text-muted">Unassigned</span>,
                formatDate(booking.pickupDate),
                `${booking.cargoType} · ${booking.cargoWeight}`,
                booking.payment ? formatDateTime(booking.payment.paidAt) : "—",
                booking.payment ? booking.payment.amountRwf.toLocaleString("en-RW") : "—",
                booking.payment?.status ?? "—",
                <span key={`${booking.id}-status`}><BookingBadge status={booking.status} /></span>,
                <span key={`${booking.id}-details`} className="flex items-center gap-3"><ViewLink href={detailPath(booking)} label={`View booking ${route}`} /><Link className="font-semibold text-accent-dark hover:text-brand" href={`/dashboard/tracking/${booking.id}`}>Track</Link></span>,
              ],
            };
          })}
          emptyMessage="Bookings will appear here."
        />
      </div>
    </>
  );
}
