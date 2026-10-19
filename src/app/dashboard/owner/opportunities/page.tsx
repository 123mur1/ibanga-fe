"use client";

import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { OpportunitiesList } from "@/features/opportunities/opportunities-list";

export default function OwnerOpportunitiesPage() {
  return (
    <RoleShell role="TRUCK_OWNER">
      <PageHeader
        eyebrow="Find work"
        title="Cargo opportunities"
        subtitle="Open cargo requests from importers. Send a quotation with one of your eligible trucks."
      />
      <OpportunitiesList />
    </RoleShell>
  );
}
