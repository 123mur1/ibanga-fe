"use client";

import { useParams } from "next/navigation";
import { BackLink } from "@/components/common/layout-blocks";
import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { DriverDetail } from "@/features/admin-ops/driver-views";
import { PermissionGate } from "@/features/admin-ops/use-admin";

export default function AdminDriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RoleShell role="ADMIN">
      <BackLink href="/dashboard/admin/drivers">Driver management</BackLink>
      <div className="mt-3">
        <PageHeader eyebrow="Driver" title="Driver details" subtitle="Profile, documents, assignments and eligibility." />
      </div>
      <PermissionGate permission="drivers">
        <DriverDetail id={id} />
      </PermissionGate>
    </RoleShell>
  );
}
