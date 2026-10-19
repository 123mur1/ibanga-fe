"use client";

import { useParams } from "next/navigation";
import { RoleShell } from "@/components/common/role-shell";
import { IncidentDetail } from "@/features/incidents/incident-detail";

export default function OwnerIncidentPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RoleShell role="TRUCK_OWNER">
      <IncidentDetail id={id} />
    </RoleShell>
  );
}
