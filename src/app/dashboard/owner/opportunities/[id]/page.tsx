"use client";

import { RoleShell } from "@/components/common/role-shell";
import { OpportunityDetail } from "@/features/opportunities/opportunity-detail";

export default function OwnerOpportunityPage() {
  return (
    <RoleShell role="TRUCK_OWNER">
      <OpportunityDetail />
    </RoleShell>
  );
}
