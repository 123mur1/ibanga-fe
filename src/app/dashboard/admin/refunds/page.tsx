"use client";

import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { RefundsOverview } from "@/features/admin-finance/refunds-list";

export default function AdminRefundsPage() {
  return (
    <RoleShell role="ADMIN">
      <PageHeader eyebrow="Finance" title="Refund management" subtitle="All importer refund requests, their decisions and simulated refund results." />
      <RefundsOverview />
    </RoleShell>
  );
}
