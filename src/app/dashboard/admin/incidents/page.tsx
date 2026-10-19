"use client";

import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { IncidentList } from "@/features/admin-ops/incident-views";
import { PermissionGate } from "@/features/admin-ops/use-admin";

export default function AdminIncidentsPage() {
  return (
    <RoleShell role="ADMIN">
      <PageHeader eyebrow="Operations" title="Accidents and incidents" subtitle="Reported accidents, breakdowns and cargo problems. Open incidents hold settlements." />
      <PermissionGate permission="incidents">
        <IncidentList />
      </PermissionGate>
    </RoleShell>
  );
}
