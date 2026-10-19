"use client";

import { useParams } from "next/navigation";
import { QueryBoundary } from "@/components/common/async-state";
import { BackLink } from "@/components/common/layout-blocks";
import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { DriverForm } from "@/features/drivers/driver-form";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { services } from "@/services";

export default function EditDriverPage() {
  const { id } = useParams<{ id: string }>();
  const actor = useActor();
  const query = useServiceQuery(() => services.drivers.get(actor!, id), [actor?.id, id]);
  return (
    <RoleShell role="TRUCK_OWNER">
      <BackLink href={`/dashboard/owner/drivers/${id}`}>Driver details</BackLink>
      <div className="mt-4">
        <QueryBoundary query={query}>
          {(driver) => (
            <>
              <PageHeader eyebrow={driver.ref} title={`Edit ${driver.name}`} subtitle="Changes to the licence need a new document and a new verification." />
              <DriverForm key={driver.id} driver={driver} />
            </>
          )}
        </QueryBoundary>
      </div>
    </RoleShell>
  );
}
