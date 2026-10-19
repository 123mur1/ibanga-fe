"use client";

import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { ReconciliationView } from "@/features/admin-finance/reconciliation-view";

export default function AdminReconciliationPage() {
  return (
    <RoleShell role="ADMIN">
      <PageHeader eyebrow="Finance" title="Financial reconciliation" subtitle="Compare expected and recorded amounts and review differences." />
      <ReconciliationView />
    </RoleShell>
  );
}
