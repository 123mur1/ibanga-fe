"use client";

import { useParams } from "next/navigation";
import { RoleShell } from "@/components/common/role-shell";
import { EvidencePage } from "@/features/owner-shipments/evidence-form";

export default function DriverEvidencePage() {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  return <RoleShell role="DRIVER"><EvidencePage shipmentId={shipmentId} role="DRIVER" /></RoleShell>;
}
