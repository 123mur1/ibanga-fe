"use client";

import { RoleShell } from "@/components/common/role-shell";
import { DriverDetail } from "@/features/drivers/driver-detail";

export default function OwnerDriverPage() {
  return (
    <RoleShell role="TRUCK_OWNER">
      <DriverDetail />
    </RoleShell>
  );
}
