"use client";

import Link from "next/link";
import { QueryBoundary } from "@/components/common/async-state";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, EmptyState, ViewLink } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { Shipment } from "@/types/ops";

export function EvidenceList() {
  const actor = useActor();
  const { bookings } = useIbanga();
  const query = useServiceQuery(() => services.shipments.list(actor!, { pageSize: 500 }), [actor?.id]);

  return (
    <QueryBoundary query={query}>
      {(data) => {
        const needs = data.items.filter((item) => ["ARRIVED", "UNLOADING"].includes(item.status) || item.evidence?.verification === "REJECTED");
        const waiting = data.items.filter((item) => item.evidence?.verification === "SUBMITTED");
        const verified = data.items.filter((item) => item.evidence?.verification === "VERIFIED");
        const route = (shipment: Shipment) => {
          const booking = bookings.find((item) => item.id === shipment.bookingId);
          return booking ? `${booking.pickupLocation} to ${booking.destination}` : "Route unavailable";
        };
        const table = (items: Shipment[], name: string, empty: string) => (
          <DataTable
            columns={[{ label: "Shipment" }, { label: "Route" }, { label: "Shipment status" }, { label: "Evidence" }, { label: "Updated" }, { label: "Actions", className: "text-right" }]}
            emptyMessage={empty}
            exportName={name}
            filterLabel="All"
            rows={items.map((shipment) => ({
              id: shipment.id,
              searchText: `${shipment.ref} ${route(shipment)}`,
              exportValues: [shipment.ref, route(shipment), shipment.status, shipment.evidence?.verification ?? "NONE", formatDate(shipment.evidence?.submittedAt ?? shipment.createdAt), ""],
              cells: [
                <strong key="r">{shipment.ref}</strong>,
                route(shipment),
                <StatusBadge key="s" family="shipment" status={shipment.status} />,
                shipment.evidence ? <StatusBadge key="e" family="evidence" status={shipment.evidence.verification} /> : <span key="e" className="text-sm text-muted">Not submitted</span>,
                formatDate(shipment.evidence?.submittedAt ?? shipment.createdAt),
                <div key="a" className="flex justify-end"><ViewLink href={`/dashboard/owner/delivery-evidence/${shipment.id}`} label={`Open evidence for ${shipment.ref}`} /></div>,
              ],
            }))}
          />
        );
        if (!needs.length && !waiting.length && !verified.length) {
          return (
            <EmptyState
              title="No delivery evidence to handle"
              text="Evidence is requested when a shipment arrives. Nothing is waiting right now."
              action={<Link href="/dashboard/owner/shipments" className="text-sm font-semibold text-brand hover:underline">Go to active shipments</Link>}
            />
          );
        }
        return (
          <div className="space-y-8">
            <section aria-labelledby="needs">
              <h2 id="needs" className="mb-3 font-display text-lg text-navy">Needs your evidence ({needs.length})</h2>
              {table(needs, "ibanga-evidence-needed", "Nothing needs evidence right now.")}
            </section>
            <section aria-labelledby="waiting">
              <h2 id="waiting" className="mb-3 font-display text-lg text-navy">Awaiting administrator verification ({waiting.length})</h2>
              {table(waiting, "ibanga-evidence-waiting", "No evidence is waiting for review.")}
            </section>
            {verified.length ? (
              <section aria-labelledby="verified">
                <h2 id="verified" className="mb-3 font-display text-lg text-navy">Verified ({verified.length})</h2>
                {table(verified, "ibanga-evidence-verified", "None yet.")}
              </section>
            ) : null}
          </div>
        );
      }}
    </QueryBoundary>
  );
}
