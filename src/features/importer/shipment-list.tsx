"use client";

import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, ViewLink } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import type { Shipment } from "@/types/ops";

/** Importer shipments (already scoped to the importer by the service). */
export function ShipmentTable({ shipments }: { shipments: Shipment[] }) {
  const { bookings, trucks } = useIbanga();
  return (
    <DataTable
      columns={[
        { label: "Shipment" },
        { label: "Route" },
        { label: "Truck" },
        { label: "Estimated delivery" },
        { label: "Status" },
        { label: "Delivery proof" },
        { label: "Actions", className: "text-right" },
      ]}
      emptyMessage="No shipments match your search."
      filterLabel="All statuses"
      exportName="ibanga-importer-shipments"
      rows={shipments.map((shipment) => {
        const booking = bookings.find((item) => item.id === shipment.bookingId);
        const truck = trucks.find((item) => item.id === shipment.truckId);
        const route = booking ? `${booking.pickupLocation} to ${booking.destination}` : "—";
        const proof = shipment.evidence
          ? shipment.evidence.verification === "VERIFIED"
            ? "Verified"
            : shipment.evidence.verification === "REJECTED"
              ? "Rejected"
              : "Submitted, not verified"
          : "None yet";
        return {
          id: shipment.id,
          searchText: `${shipment.ref} ${route} ${truck?.plateNumber ?? ""} ${shipment.bookingId} ${shipment.status}`,
          filterValue: shipment.status,
          exportValues: [shipment.ref, route, truck?.plateNumber ?? "", formatDate(shipment.etaDate), shipment.status, proof, ""],
          cells: [
            <span key="ref"><strong className="block text-brand">{shipment.ref}</strong><span className="text-xs text-muted">{shipment.bookingId}</span></span>,
            <span key="route" className="min-w-40 font-semibold">{route}</span>,
            truck ? `${truck.plateNumber} · ${truck.truckType}` : "—",
            formatDate(shipment.etaDate),
            <StatusBadge key="status" family="shipment" status={shipment.status} />,
            proof,
            <div key="action" className="flex justify-end"><ViewLink href={`/dashboard/importer/shipments/${shipment.id}`} label={`View shipment ${shipment.ref}`} /></div>,
          ],
        };
      })}
    />
  );
}
