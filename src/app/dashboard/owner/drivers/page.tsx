"use client";

import Link from "next/link";
import { RoleShell } from "@/components/common/role-shell";
import { PageHeader, PrimaryButton } from "@/components/ui";
import { DriversList } from "@/features/drivers/drivers-list";

export default function OwnerDriversPage() {
  return (
    <RoleShell role="TRUCK_OWNER">
      <PageHeader
        eyebrow="Fleet"
        title="Drivers"
        subtitle="Your drivers, their verification and licence status, and where they are assigned."
        actions={<Link href="/dashboard/owner/drivers/new"><PrimaryButton type="button">Add a driver</PrimaryButton></Link>}
      />
      <div className="mt-6"><DriversList /></div>
    </RoleShell>
  );
}
