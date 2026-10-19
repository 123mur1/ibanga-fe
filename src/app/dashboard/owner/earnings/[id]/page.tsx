"use client";

import { useParams } from "next/navigation";
import { RoleShell } from "@/components/common/role-shell";
import { SettlementDetail } from "@/features/settlements/settlement-detail";

export default function OwnerSettlementPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RoleShell role="TRUCK_OWNER">
      <SettlementDetail id={id} />
    </RoleShell>
  );
}
