"use client";

import { RoleShell } from "@/components/common/role-shell";
import { BackLink } from "@/components/common/layout-blocks";
import { PageHeader } from "@/components/ui";
import { DriverForm } from "@/features/drivers/driver-form";

export default function NewDriverPage() {
  return (
    <RoleShell role="TRUCK_OWNER">
      <BackLink href="/dashboard/owner/drivers">Drivers</BackLink>
      <div className="mt-4">
        <PageHeader eyebrow="Fleet" title="Add a driver" subtitle="Register the driver and upload the licence for verification." />
      </div>
      <DriverForm />
    </RoleShell>
  );
}
