"use client";

import { QueryBoundary } from "@/components/common/async-state";
import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { LinkButton } from "@/features/importer/link-button";
import { ShipmentTable } from "@/features/importer/shipment-list";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { services } from "@/services";

export default function ImporterShipmentsPage() {
  const actor = useActor();
  const query = useServiceQuery(() => services.shipments.list(actor!, { pageSize: 500, sort: { field: "createdAt", direction: "desc" } }), [actor?.id]);

  return (
    <RoleShell role="IMPORTER">
      <PageHeader
        eyebrow="Shipping"
        title="Shipments"
        subtitle="Follow each booked cargo from pickup to delivery. Shipments appear when a booking is confirmed."
      />
      <div className="mt-6">
        <QueryBoundary
          query={query}
          isEmpty={(data) => data.items.length === 0}
          empty={{
            title: "No shipments yet",
            text: "A shipment is created when a booking is confirmed. Start with a cargo request or find a truck.",
            action: <LinkButton href="/dashboard/importer/cargo-requests/new">New cargo request</LinkButton>,
          }}
        >
          {(data) => <ShipmentTable shipments={data.items} />}
        </QueryBoundary>
      </div>
    </RoleShell>
  );
}
