"use client";

import { QueryBoundary } from "@/components/common/async-state";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, ViewLink } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDateTime, titleCase } from "@/lib/format";
import { services } from "@/services";
import Link from "next/link";

export function IncidentList() {
  const actor = useActor();
  const { shipments } = useOps();
  const query = useServiceQuery(() => services.incidents.list(actor!, { pageSize: 500 }), [actor?.id]);
  return (
    <QueryBoundary
      query={query}
      isEmpty={(data) => data.items.length === 0}
      empty={{
        title: "No incidents reported",
        text: "If something goes wrong on a trip, report it so the importer and iBanga can help.",
        action: <Link href="/dashboard/owner/incidents/new" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Report an incident</Link>,
      }}
    >
      {(data) => (
        <DataTable
          columns={[{ label: "Incident" }, { label: "Type" }, { label: "Shipment" }, { label: "Severity" }, { label: "Status" }, { label: "Occurred" }, { label: "Actions", className: "text-right" }]}
          emptyMessage="No incidents match."
          filterLabel="All incident statuses"
          exportName="ibanga-owner-incidents"
          rows={data.items.map((incident) => {
            const shipment = shipments.find((item) => item.id === incident.shipmentId);
            return {
              id: incident.id,
              searchText: `${incident.ref} ${incident.type} ${incident.location} ${incident.status} ${shipment?.ref ?? ""}`,
              filterValue: incident.status,
              extraFilterValue: incident.severity,
              exportValues: [incident.ref, titleCase(incident.type), shipment?.ref ?? "", incident.severity, incident.status, formatDateTime(incident.occurredAt), ""],
              cells: [
                <strong key="r">{incident.ref}</strong>,
                titleCase(incident.type),
                shipment?.ref ?? "—",
                <StatusBadge key="sev" family="severity" status={incident.severity} />,
                <StatusBadge key="st" family="incident" status={incident.status} />,
                formatDateTime(incident.occurredAt),
                <div key="a" className="flex justify-end"><ViewLink href={`/dashboard/owner/incidents/${incident.id}`} label={`Open incident ${incident.ref}`} /></div>,
              ],
            };
          })}
          extraFilterLabel="All severities"
        />
      )}
    </QueryBoundary>
  );
}
