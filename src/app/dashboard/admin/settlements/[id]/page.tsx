"use client";

import { useParams } from "next/navigation";
import { RoleShell } from "@/components/common/role-shell";
import { SettlementDetail } from "@/features/admin-finance/settlement-detail";

export default function AdminSettlementDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RoleShell role="ADMIN">
      <SettlementDetail id={id} />
    </RoleShell>
  );
}
