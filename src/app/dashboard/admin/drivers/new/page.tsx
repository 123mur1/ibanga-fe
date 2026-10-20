"use client";

import { RoleShell } from "@/components/common/role-shell";
import { BackLink } from "@/components/common/layout-blocks";
import { PageHeader } from "@/components/ui";
import { PermissionGate } from "@/features/admin-ops/use-admin";
import { DriverForm } from "@/features/drivers/driver-form";

export default function AdminNewDriverPage() {
  return (
    <RoleShell role="ADMIN">
      <BackLink href="/dashboard/admin/users">Users</BackLink>
      <div className="mt-4">
        <PageHeader eyebrow="People" title="Add a driver" subtitle="Register a driver under a truck owner and submit their licence for verification." />
      </div>
      <PermissionGate permission="drivers"><DriverForm /></PermissionGate>
    </RoleShell>
  );
}
