"use client";

import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { PermissionGate } from "@/features/admin-ops/use-admin";
import { VerificationQueue } from "@/features/admin-ops/verification-queue";

export default function AdminVerificationsPage() {
  return (
    <RoleShell role="ADMIN">
      <PageHeader eyebrow="Trust and safety" title="Verification requests" subtitle="Review identity, company, driver, vehicle and insurance documents. Pending requests come first." />
      <PermissionGate permission="verifications">
        <VerificationQueue />
      </PermissionGate>
    </RoleShell>
  );
}
