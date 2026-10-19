"use client";

import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { CargoRequestList } from "@/features/admin-ops/cargo-views";
import { PermissionGate } from "@/features/admin-ops/use-admin";

export default function AdminCargoRequestsPage() {
  return (
    <RoleShell role="ADMIN">
      <PageHeader eyebrow="Marketplace" title="Cargo requests" subtitle="All importer requests, their quotations and what they became." />
      <PermissionGate permission="cargo">
        <CargoRequestList />
      </PermissionGate>
    </RoleShell>
  );
}
