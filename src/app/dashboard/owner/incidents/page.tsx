"use client";

import Link from "next/link";
import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { IncidentList } from "@/features/incidents/incident-list";

export default function OwnerIncidentsPage() {
  return (
    <RoleShell role="TRUCK_OWNER">
      <PageHeader
        eyebrow="Fleet"
        title="Accidents and incidents"
        subtitle="Report problems on the road and follow up on insurance claims."
        actions={<Link href="/dashboard/owner/incidents/new" className="inline-flex items-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">Report an incident</Link>}
      />
      <div className="mt-6">
        <IncidentList />
      </div>
    </RoleShell>
  );
}
