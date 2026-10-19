"use client";

import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { OwnerReports } from "@/features/owner-shipments/owner-reports";

export default function OwnerReportsPage() {
  return (
    <RoleShell role="TRUCK_OWNER">
      <PageHeader eyebrow="More" title="Performance reports" subtitle="Trips, punctuality, earnings, drivers and truck utilisation." />
      <OwnerReports />
    </RoleShell>
  );
}
