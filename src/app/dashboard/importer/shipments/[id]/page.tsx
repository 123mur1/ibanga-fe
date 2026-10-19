"use client";

import { useParams } from "next/navigation";
import { QueryBoundary } from "@/components/common/async-state";
import { BackLink } from "@/components/common/layout-blocks";
import { RoleShell } from "@/components/common/role-shell";
import { StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/ui";
import { ShipmentActions } from "@/features/importer/shipment-actions";
import { ShipmentOverview } from "@/features/shipments/shipment-view";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { services } from "@/services";

export default function ImporterShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const actor = useActor();
  const query = useServiceQuery(() => services.shipments.get(actor!, id), [actor?.id, id]);

  return (
    <RoleShell role="IMPORTER">
      <BackLink href="/dashboard/importer/shipments">Shipments</BackLink>
      <div className="mt-4">
        <QueryBoundary query={query}>
          {(shipment) => (
            <div className="space-y-5">
              <PageHeader eyebrow="Shipment" title={shipment.ref} subtitle={`Booking ${shipment.bookingId}`} actions={<StatusBadge family="shipment" status={shipment.status} />} />
              <ShipmentActions shipment={shipment} />
              <ShipmentOverview shipment={shipment} role="IMPORTER" />
            </div>
          )}
        </QueryBoundary>
      </div>
    </RoleShell>
  );
}
