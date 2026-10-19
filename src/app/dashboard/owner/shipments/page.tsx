"use client";

import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { OwnerShipmentList } from "@/features/owner-shipments/shipment-list";

export default function OwnerShipmentsPage() {
  return (
    <RoleShell role="TRUCK_OWNER">
      <PageHeader eyebrow="Work" title="Active shipments" subtitle="Run your trips: record milestones, report delays and submit proof of delivery." />
      <div className="mt-6">
        <OwnerShipmentList />
      </div>
    </RoleShell>
  );
}
