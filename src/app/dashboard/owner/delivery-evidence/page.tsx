"use client";

import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { EvidenceList } from "@/features/owner-shipments/evidence-list";

export default function OwnerDeliveryEvidencePage() {
  return (
    <RoleShell role="TRUCK_OWNER">
      <PageHeader eyebrow="Work" title="Delivery evidence" subtitle="Proof of delivery is reviewed by an administrator. Submitted evidence is not verified delivery." />
      <div className="mt-6">
        <EvidenceList />
      </div>
    </RoleShell>
  );
}
