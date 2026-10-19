"use client";

import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { ShipmentList } from "@/features/admin-ops/shipment-views";
import { PermissionGate } from "@/features/admin-ops/use-admin";

export default function AdminShipmentsPage() {
  return (
    <RoleShell role="ADMIN">
      <PageHeader eyebrow="Operations" title="Shipments and tracking" subtitle="Follow every shipment, verify delivery evidence and see settlement holds." />
      <PermissionGate permission="shipments">
        <ShipmentList />
      </PermissionGate>
    </RoleShell>
  );
}
