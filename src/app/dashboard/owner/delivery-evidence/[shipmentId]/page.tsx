"use client";

import { useParams } from "next/navigation";
import { RoleShell } from "@/components/common/role-shell";
import { EvidencePage } from "@/features/owner-shipments/evidence-form";

export default function OwnerEvidenceFormPage() {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  return (
    <RoleShell role="TRUCK_OWNER">
      <EvidencePage shipmentId={shipmentId} />
    </RoleShell>
  );
}
