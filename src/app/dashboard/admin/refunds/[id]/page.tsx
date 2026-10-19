"use client";

import { useParams } from "next/navigation";
import { RoleShell } from "@/components/common/role-shell";
import { RefundDetail } from "@/features/admin-finance/refund-detail";

export default function AdminRefundDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RoleShell role="ADMIN">
      <RefundDetail id={id} />
    </RoleShell>
  );
}
