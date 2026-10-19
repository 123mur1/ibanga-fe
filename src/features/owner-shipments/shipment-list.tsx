"use client";

import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Tabs } from "@/components/common/tabs";
import { DataTable, ViewLink } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";

type View = "active" | "delivered" | "all";
const ACTIVE = ["SCHEDULED", "PICKUP_CONFIRMED", "LOADED", "DEPARTED", "IN_TRANSIT", "DELAYED", "ARRIVED", "UNLOADING"];

export function OwnerShipmentList() {
  const actor = useActor();
  const { bookings } = useIbanga();
  const [view, setView] = useState<View>("active");
  const query = useServiceQuery(() => services.shipments.list(actor!, { pageSize: 500 }), [actor?.id]);

  return (
    <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0} empty={{ title: "No shipments yet", text: "A shipment appears here once an importer accepts your quotation or a booking is confirmed." }}>
      {(data) => {
        const items = data.items.filter((item) => (view === "all" ? true : view === "active" ? ACTIVE.includes(item.status) : !ACTIVE.includes(item.status)));
        return (
          <div className="space-y-4">
            <Tabs
              label="Shipment views"
              value={view}
              onChange={setView}
              tabs={[
                { key: "active", label: "Active", count: data.items.filter((item) => ACTIVE.includes(item.status)).length },
                { key: "delivered", label: "Delivered and closed", count: data.items.filter((item) => !ACTIVE.includes(item.status)).length },
                { key: "all", label: "All", count: data.items.length },
              ]}
            />
            <DataTable
              key={view}
              columns={[{ label: "Shipment" }, { label: "Route" }, { label: "Cargo" }, { label: "Estimated delivery" }, { label: "Status" }, { label: "Evidence" }, { label: "Actions", className: "text-right" }]}
              emptyMessage="No shipments match this view."
              filterLabel="All shipment statuses"
              exportName="ibanga-owner-shipments"
              rows={items.map((shipment) => {
                const booking = bookings.find((item) => item.id === shipment.bookingId);
                const route = booking ? `${booking.pickupLocation} to ${booking.destination}` : "Route unavailable";
                return {
                  id: shipment.id,
                  searchText: `${shipment.ref} ${route} ${booking?.cargoType ?? ""} ${shipment.status}`,
                  filterValue: shipment.status,
                  exportValues: [shipment.ref, route, booking?.cargoType ?? "", formatDate(shipment.etaDate), shipment.status, shipment.evidence?.verification ?? "NONE", ""],
                  cells: [
                    <strong key="ref">{shipment.ref}</strong>,
                    <span key="route" className="min-w-40 block">{route}</span>,
                    booking?.cargoType ?? "—",
                    formatDate(shipment.etaDate),
                    <StatusBadge key="status" family="shipment" status={shipment.status} />,
                    shipment.evidence ? <StatusBadge key="ev" family="evidence" status={shipment.evidence.verification} /> : <span key="ev" className="text-sm text-muted">Not submitted</span>,
                    <div key="act" className="flex justify-end"><ViewLink href={`/dashboard/owner/shipments/${shipment.id}`} label={`Open shipment ${shipment.ref}`} /></div>,
                  ],
                };
              })}
            />
          </div>
        );
      }}
    </QueryBoundary>
  );
}
