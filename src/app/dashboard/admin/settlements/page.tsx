"use client";

import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { SettlementsOverview } from "@/features/admin-finance/settlements-list";

export default function AdminSettlementsPage() {
  return (
    <RoleShell role="ADMIN">
      <PageHeader eyebrow="Finance" title="Settlements and payouts" subtitle="Review owner settlements, check eligibility and run simulated payouts." />
      <SettlementsOverview />
    </RoleShell>
  );
}
