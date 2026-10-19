"use client";

import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { PayoutList } from "@/features/settlements/payout-list";

export default function OwnerPayoutsPage() {
  return (
    <RoleShell role="TRUCK_OWNER">
      <PageHeader eyebrow="Money" title="Payout history" subtitle="Simulated payouts to your payout destination." />
      <div className="mt-6">
        <PayoutList />
      </div>
    </RoleShell>
  );
}
