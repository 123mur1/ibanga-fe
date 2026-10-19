"use client";

import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { DriverList } from "@/features/admin-ops/driver-views";
import { PermissionGate } from "@/features/admin-ops/use-admin";

export default function AdminDriversPage() {
  return (
    <RoleShell role="ADMIN">
      <PageHeader eyebrow="People" title="Driver management" subtitle="Every driver across all truck owners, with verification, licence expiry and eligibility." />
      <PermissionGate permission="drivers">
        <DriverList />
      </PermissionGate>
    </RoleShell>
  );
}
