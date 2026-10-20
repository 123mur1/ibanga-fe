"use client";

import { QueryBoundary } from "@/components/common/async-state";
import { DetailList, Section } from "@/components/common/layout-blocks";
import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import Link from "next/link";
import { DelayForm, MilestonePanel } from "@/features/owner-shipments/milestone-panel";
import { ShipmentOverview } from "@/features/shipments/shipment-view";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";

export default function DriverDashboardPage() {
  const actor = useActor();
  const { trucks, users } = useIbanga();
  const ops = useOps();
  const driver = ops.drivers.find((item) => item.userId === actor?.id);
  const truck = trucks.find((item) => item.id === driver?.assignedTruckId);
  const owner = users.find((item) => item.id === driver?.ownerId);
  const query = useServiceQuery(() => services.shipments.list(actor!, { pageSize: 100 }), [actor?.id]);

  return (
    <RoleShell role="DRIVER">
      <PageHeader eyebrow="Driver workspace" title={`Welcome, ${actor?.name ?? "Driver"}`} subtitle="Your assigned truck, active cargo and trip updates." />
      <div className="mt-6 space-y-5">
        <Section title="Your truck" description="Your owner manages truck and trip assignments.">
          {driver && truck ? (
            <DetailList items={[
              { label: "Truck", value: `${truck.plateNumber} · ${truck.truckType}` },
              { label: "Capacity", value: `${truck.capacity} tons` },
              { label: "Owner", value: owner?.company ?? owner?.name ?? "Truck owner" },
              { label: "Contact", value: owner?.phone ?? "Contact your owner for details" },
            ]} />
          ) : <p className="text-sm text-muted">Your truck association is not available. Contact your truck owner.</p>}
        </Section>
        <Section title="Assigned cargo" description="Only shipments assigned to your driver account appear here.">
          <QueryBoundary query={query} isEmpty={(result) => result.items.length === 0} empty={{ title: "No trips assigned", text: "Your truck owner will assign your next trip here." }}>
            {(data) => <div className="space-y-5">{data.items.map((shipment) => (
              <article key={shipment.id} className="space-y-4 rounded-xl border border-line p-4">
                <ShipmentOverview shipment={shipment} role="DRIVER" />
                <MilestonePanel shipment={shipment} />
                <DelayForm shipment={shipment} />
                {(["ARRIVED", "UNLOADING"].includes(shipment.status) || shipment.evidence?.verification === "REJECTED") ? (
                  <Link href={`/dashboard/driver/delivery-evidence/${shipment.id}`} className="inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
                    {shipment.evidence?.verification === "REJECTED" ? "Resubmit delivery evidence" : "Submit delivery evidence"}
                  </Link>
                ) : null}
              </article>
            ))}</div>}
          </QueryBoundary>
        </Section>
      </div>
    </RoleShell>
  );
}
