"use client";

import { useParams } from "next/navigation";
import { BackLink } from "@/components/common/layout-blocks";
import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { IncidentDetail } from "@/features/admin-ops/incident-views";
import { PermissionGate } from "@/features/admin-ops/use-admin";

export default function AdminIncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RoleShell role="ADMIN">
      <BackLink href="/dashboard/admin/incidents">Accidents and incidents</BackLink>
      <div className="mt-3">
        <PageHeader eyebrow="Incident" title="Incident details" subtitle="Evidence, timeline, responsibility, insurance and resolution." />
      </div>
      <PermissionGate permission="incidents">
        <IncidentDetail id={id} />
      </PermissionGate>
    </RoleShell>
  );
}
