"use client";

import { useParams } from "next/navigation";
import { BackLink } from "@/components/common/layout-blocks";
import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { PermissionGate } from "@/features/admin-ops/use-admin";
import { VerificationDetail } from "@/features/admin-ops/verification-detail";

export default function AdminVerificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RoleShell role="ADMIN">
      <BackLink href="/dashboard/admin/verifications">Verification requests</BackLink>
      <div className="mt-3">
        <PageHeader eyebrow="Verification" title="Review request" subtitle="Check the documents, see the effect on eligibility, then approve or reject." />
      </div>
      <PermissionGate permission="verifications">
        <VerificationDetail id={id} />
      </PermissionGate>
    </RoleShell>
  );
}
