"use client";

import Link from "next/link";
import { QueryBoundary } from "@/components/common/async-state";
import { StatusBadge } from "@/components/common/status-badge";
import { StatGrid } from "@/components/common/layout-blocks";
import { DataTable, PrimaryButton, StatCard, ViewLink } from "@/components/ui";
import { driverEligibility, expiryState } from "@/config/business-rules";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";

export function DriversList() {
  const actor = useActor();
  const ops = useOps();
  const { trucks } = useIbanga();
  const query = useServiceQuery(() => services.drivers.list(actor!, { pageSize: 200 }), [actor?.id]);

  return (
    <QueryBoundary
      query={query}
      isEmpty={(data) => data.items.length === 0}
      empty={{
        title: "No drivers yet",
        text: "Register your drivers so you can assign them to trucks and trips.",
        action: <Link href="/dashboard/owner/drivers/new"><PrimaryButton type="button">Add a driver</PrimaryButton></Link>,
      }}
    >
      {(data) => {
        const items = data.items;
        const issues = items.filter((driver) => !driverEligibility(driver, ops.documents).eligible).length;
        return (
          <>
            <StatGrid>
              <StatCard label="Drivers" value={items.length} hint="Registered with you" />
              <StatCard label="Available" value={items.filter((driver) => driver.status === "AVAILABLE").length} accent="good" hint="Ready for work" />
              <StatCard label="On a trip" value={items.filter((driver) => driver.status === "ON_TRIP").length} accent="accent" hint="Currently assigned" />
              <StatCard label="Need attention" value={issues} accent={issues ? "bad" : "good"} hint="Verification or licence issue" />
            </StatGrid>
            <div className="mt-5">
              <DataTable
                columns={[{ label: "Driver" }, { label: "Status" }, { label: "Verification" }, { label: "Licence" }, { label: "Truck" }, { label: "Actions", className: "text-right" }]}
                emptyMessage="No drivers match."
                filterLabel="All driver statuses"
                extraFilterLabel="All licence states"
                exportName="ibanga-drivers"
                rows={items.map((driver) => {
                  const licence = expiryState(driver.licenceExpiry);
                  const truck = trucks.find((item) => item.id === driver.assignedTruckId);
                  return {
                    id: driver.id,
                    searchText: `${driver.ref} ${driver.name} ${driver.phone} ${driver.licenceNumber} ${truck?.plateNumber ?? ""}`,
                    filterValue: driver.status,
                    extraFilterValue: licence,
                    exportValues: [driver.name, driver.status, driver.verification, `${driver.licenceNumber} (${formatDate(driver.licenceExpiry)})`, truck?.plateNumber ?? "", ""],
                    cells: [
                      <span key="n" className="min-w-40"><strong className="block">{driver.name}</strong><span className="text-xs text-muted">{driver.ref} · {driver.phone}</span></span>,
                      <StatusBadge key="s" family="driver" status={driver.status} />,
                      <StatusBadge key="v" family="verification" status={driver.verification} />,
                      <span key="l" className="flex flex-col gap-1 text-sm">
                        <span>{driver.licenceNumber} · {driver.licenceCategory}</span>
                        <span className="flex items-center gap-2"><StatusBadge family="documentExpiry" status={licence} /><span className="text-xs text-muted">{formatDate(driver.licenceExpiry)}</span></span>
                      </span>,
                      truck?.plateNumber ?? <span key="t" className="text-muted">Unassigned</span>,
                      <div key="a" className="flex justify-end"><ViewLink href={`/dashboard/owner/drivers/${driver.id}`} label={`View driver ${driver.name}`} /></div>,
                    ],
                  };
                })}
              />
            </div>
          </>
        );
      }}
    </QueryBoundary>
  );
}
