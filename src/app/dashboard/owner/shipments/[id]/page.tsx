"use client";

import { useParams } from "next/navigation";
import { RoleShell } from "@/components/common/role-shell";
import { OwnerShipmentDetail } from "@/features/owner-shipments/shipment-detail";

export default function OwnerShipmentPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RoleShell role="TRUCK_OWNER">
      <OwnerShipmentDetail id={id} />
    </RoleShell>
  );
}
