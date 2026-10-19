"use client";

import { useParams } from "next/navigation";
import { BackLink } from "@/components/common/layout-blocks";
import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { AdminTruckDetail } from "@/features/admin-ops/truck-detail";
import { PermissionGate } from "@/features/admin-ops/use-admin";

export default function AdminTruckDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RoleShell role="ADMIN">
      <BackLink href="/dashboard/admin/trucks">Truck management</BackLink>
      <div className="mt-3">
        <PageHeader eyebrow="Truck" title="Truck details" subtitle="Listing, operations profile, documents, eligibility and bookings." />
      </div>
      <PermissionGate permission="trucks">
        <AdminTruckDetail id={id} />
      </PermissionGate>
    </RoleShell>
  );
}
