"use client";

import { useParams } from "next/navigation";
import { RoleShell } from "@/components/common/role-shell";
import { CancellationDetail } from "@/features/admin-finance/cancellation-detail";

export default function AdminCancellationDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RoleShell role="ADMIN">
      <CancellationDetail id={id} />
    </RoleShell>
  );
}
