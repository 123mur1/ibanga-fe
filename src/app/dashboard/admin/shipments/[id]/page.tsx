"use client";

import { useParams } from "next/navigation";
import { BackLink } from "@/components/common/layout-blocks";
import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { AdminShipmentDetail } from "@/features/admin-ops/shipment-views";
import { PermissionGate } from "@/features/admin-ops/use-admin";

export default function AdminShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RoleShell role="ADMIN">
      <BackLink href="/dashboard/admin/shipments">Shipments and tracking</BackLink>
      <div className="mt-3">
        <PageHeader eyebrow="Shipment" title="Shipment details" subtitle="Milestones, proof of delivery and administrator controls." />
      </div>
      <PermissionGate permission="shipments">
        <AdminShipmentDetail id={id} />
      </PermissionGate>
    </RoleShell>
  );
}
