"use client";

import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { ReportsView } from "@/features/importer/reports-view";

export default function ImporterReportsPage() {
  return (
    <RoleShell role="IMPORTER">
      <PageHeader eyebrow="Insights" title="Reports and history" subtitle="Everything you requested, booked and shipped. Filter by date or type and export what you see." />
      <div className="mt-6">
        <ReportsView />
      </div>
    </RoleShell>
  );
}
