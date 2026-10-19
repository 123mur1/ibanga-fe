"use client";

import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { ExpiryMonitor } from "@/features/admin-ops/expiry-monitor";
import { PermissionGate } from "@/features/admin-ops/use-admin";

export default function AdminDocumentExpiryPage() {
  return (
    <RoleShell role="ADMIN">
      <PageHeader eyebrow="Compliance" title="Document expiry" subtitle="Expired and expiring documents, and the trucks and drivers they make ineligible." />
      <PermissionGate permission="documents">
        <ExpiryMonitor />
      </PermissionGate>
    </RoleShell>
  );
}
