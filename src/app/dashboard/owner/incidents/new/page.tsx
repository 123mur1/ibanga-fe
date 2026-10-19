"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RoleShell } from "@/components/common/role-shell";
import { BackLink } from "@/components/common/layout-blocks";
import { PageHeader } from "@/components/ui";
import { IncidentForm } from "@/features/incidents/incident-form";

function Content() {
  const shipment = useSearchParams().get("shipment") ?? "";
  return <IncidentForm initialShipmentId={shipment} />;
}

export default function NewIncidentPage() {
  return (
    <RoleShell role="TRUCK_OWNER">
      <div className="space-y-5">
        <BackLink href="/dashboard/owner/incidents">All incidents</BackLink>
        <PageHeader eyebrow="Fleet" title="Report an incident" subtitle="Reporting an incident places a hold on the shipment's settlement until it is resolved." />
        <Suspense fallback={null}>
          <Content />
        </Suspense>
      </div>
    </RoleShell>
  );
}
