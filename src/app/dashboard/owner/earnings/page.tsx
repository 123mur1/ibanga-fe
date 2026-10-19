"use client";

import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { SettlementList } from "@/features/settlements/settlement-list";

export default function OwnerEarningsPage() {
  return (
    <RoleShell role="TRUCK_OWNER">
      <PageHeader eyebrow="Money" title="Earnings and settlements" subtitle="What you are owed for each trip, and what must happen before it can be paid out." />
      <SettlementList />
    </RoleShell>
  );
}
