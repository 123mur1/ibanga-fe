"use client";

import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { CancellationsOverview } from "@/features/admin-finance/cancellations-list";

export default function AdminCancellationsPage() {
  return (
    <RoleShell role="ADMIN">
      <PageHeader eyebrow="Finance" title="Cancellation management" subtitle="Review cancellation requests, their policy outcome and refunds." />
      <CancellationsOverview />
    </RoleShell>
  );
}
