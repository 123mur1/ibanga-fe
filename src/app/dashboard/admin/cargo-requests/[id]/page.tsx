"use client";

import { useParams } from "next/navigation";
import { BackLink } from "@/components/common/layout-blocks";
import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { CargoRequestDetail } from "@/features/admin-ops/cargo-views";
import { PermissionGate } from "@/features/admin-ops/use-admin";

export default function AdminCargoRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RoleShell role="ADMIN">
      <BackLink href="/dashboard/admin/cargo-requests">Cargo requests</BackLink>
      <div className="mt-3">
        <PageHeader eyebrow="Cargo request" title="Request details" subtitle="Full details, quotations, importer and linked booking." />
      </div>
      <PermissionGate permission="cargo">
        <CargoRequestDetail id={id} />
      </PermissionGate>
    </RoleShell>
  );
}
