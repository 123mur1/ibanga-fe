"use client";

import { QueryBoundary } from "@/components/common/async-state";
import { ConfirmButton } from "@/components/common/confirm-button";
import { DetailList, Section, StatGrid } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { driverEligibility } from "@/config/business-rules";
import { DataTable, StatCard, ViewLink } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate, formatPercent, titleCase } from "@/lib/format";
import { services } from "@/services";
import type { Driver } from "@/types/ops";
import { DocumentList, ExpiryBadge } from "./document-list";
import { EligibilityNotice } from "./eligibility-card";
import { TextLink, useAdminLookups } from "./use-admin";

export function DriverList() {
  const actor = useActor();
  const ops = useOps();
  const { userName } = useAdminLookups();
  const query = useServiceQuery(() => services.drivers.list(actor!, { pageSize: 500 }), [actor?.id]);

  return (
    <div className="mt-6">
      <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0} empty={{ title: "No drivers yet", text: "Drivers appear here when truck owners add them." }}>
        {(data) => {
          const eligible = data.items.filter((driver) => driverEligibility(driver, ops.documents).eligible).length;
          const unverified = data.items.filter((driver) => driver.verification !== "APPROVED").length;
          return (
            <>
              <StatGrid>
                <StatCard label="Drivers" value={data.total} hint="All owners" />
                <StatCard label="Eligible for work" value={eligible} hint="Verified, licence valid" accent="good" />
                <StatCard label="Not eligible" value={data.total - eligible} hint="See reasons on each driver" accent="warn" />
                <StatCard label="Unverified" value={unverified} hint="Pending, rejected or expired" accent="bad" />
              </StatGrid>
              <div className="mt-5">
                <DataTable
                  columns={[{ label: "Driver" }, { label: "Owner" }, { label: "Status" }, { label: "Verification" }, { label: "Licence expiry" }, { label: "Eligible" }, { label: "Actions", className: "text-right" }]}
                  filterLabel="All driver statuses"
                  extraFilterLabel="All verification states"
                  exportName="ibanga-admin-drivers"
                  emptyMessage="No drivers match."
                  rows={data.items.map((driver) => {
                    const result = driverEligibility(driver, ops.documents);
                    return {
                      id: driver.id,
                      searchText: `${driver.name} ${driver.ref} ${driver.phone} ${driver.licenceNumber} ${userName(driver.ownerId)}`,
                      filterValue: driver.status,
                      extraFilterValue: driver.verification,
                      exportValues: [driver.name, userName(driver.ownerId), driver.status, driver.verification, formatDate(driver.licenceExpiry), result.eligible ? "Yes" : "No", ""],
                      cells: [
                        <span key="d"><strong className="block">{driver.name}</strong><span className="text-xs text-muted">{driver.ref} · {driver.phone}</span></span>,
                        userName(driver.ownerId),
                        <StatusBadge key="s" family="driver" status={driver.status} />,
                        <StatusBadge key="v" family="verification" status={driver.verification} />,
                        <span key="l" className="block min-w-40"><span className="mb-1 block text-xs text-muted">{formatDate(driver.licenceExpiry)}</span><ExpiryBadge expiryDate={driver.licenceExpiry} /></span>,
                        result.eligible ? "Yes" : "No",
                        <div key="a" className="flex justify-end"><ViewLink href={`/dashboard/admin/drivers/${driver.id}`} label={`View driver ${driver.name}`} /></div>,
                      ],
                    };
                  })}
                />
              </div>
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}

function DriverBody({ driver }: { driver: Driver }) {
  const actor = useActor();
  const ops = useOps();
  const { run, busy } = useAction();
  const { userName, truckLabel } = useAdminLookups();
  const documents = ops.documents.filter((doc) => doc.subjectKind === "DRIVER" && doc.subjectId === driver.id);
  const assignments = ops.driverAssignments.filter((item) => item.driverId === driver.id).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const result = driverEligibility(driver, ops.documents);
  const suspended = driver.status === "SUSPENDED";
  const onTrip = driver.status === "ON_TRIP";

  return (
    <div className="space-y-5">
      <EligibilityNotice subject={driver.name} result={result} />
      <Section title="Profile" actions={<StatusBadge family="driver" status={driver.status} />}>
        <DetailList
          items={[
            { label: "Driver", value: `${driver.name} (${driver.ref})` },
            { label: "Owner", value: userName(driver.ownerId) },
            { label: "Phone", value: driver.phone },
            { label: "Email", value: driver.email ?? "—" },
            { label: "Licence", value: `${driver.licenceNumber} · category ${driver.licenceCategory}` },
            { label: "Licence expiry", value: <span className="flex flex-wrap items-center gap-2">{formatDate(driver.licenceExpiry)} <ExpiryBadge expiryDate={driver.licenceExpiry} /></span> },
            { label: "Verification", value: <StatusBadge family="verification" status={driver.verification} /> },
            { label: "Assigned truck", value: driver.assignedTruckId ? <TextLink href={`/dashboard/admin/trucks/${driver.assignedTruckId}`}>{truckLabel(driver.assignedTruckId)}</TextLink> : "None" },
            { label: "Trips completed", value: driver.tripsCompleted },
            { label: "On-time rate", value: formatPercent(driver.onTimeRate) },
            { label: "Rating", value: driver.rating.toFixed(1) },
            { label: "Joined", value: formatDate(driver.joinedAt) },
          ]}
        />
        <p className="mt-4 text-xs text-muted">Identity numbers are never shown on this screen.</p>
      </Section>

      <Section title="Documents" description="Licence and supporting documents on file.">
        <DocumentList documents={documents} />
        <div className="mt-4"><TextLink href="/dashboard/admin/verifications">Open verification requests</TextLink></div>
      </Section>

      <Section title="Assignments" description={`${assignments.length} on record`}>
        {assignments.length ? (
          <ul className="divide-y divide-line text-sm">
            {assignments.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span>
                  <TextLink href={`/dashboard/admin/trucks/${item.truckId}`}>{truckLabel(item.truckId)}</TextLink>
                  <span className="block text-xs text-muted">{formatDate(item.startDate)} to {formatDate(item.endDate)}{item.bookingId ? ` · booking ${item.bookingId}` : ""}</span>
                </span>
                <span className="flex items-center gap-3">
                  {item.shipmentId ? <TextLink href={`/dashboard/admin/shipments/${item.shipmentId}`}>Shipment</TextLink> : null}
                  <StatusBadge family="assignment" status={item.status} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">This driver has no assignments.</p>
        )}
      </Section>

      <Section title="Controlled actions" description="Administrative status changes are recorded in the audit log.">
        {onTrip && !suspended ? <div className="mb-3"><Notice tone="warning" title="Driver is on a trip">Suspending now does not stop the active trip. Contact the owner first.</Notice></div> : null}
        {suspended ? (
          <ConfirmButton
            label="Reactivate driver"
            title={`Reactivate ${driver.name}?`}
            message="The driver returns to available status."
            summary={["Eligibility still depends on verification and a valid licence"]}
            disabled={busy}
            onConfirm={() => run(() => services.drivers.setStatus(actor!, driver.id, "AVAILABLE"), { success: "Driver reactivated." })}
          />
        ) : (
          <ConfirmButton
            label="Suspend driver"
            title={`Suspend ${driver.name}?`}
            message="A suspended driver cannot be assigned to new work."
            summary={["Status becomes Suspended", "The owner can no longer assign this driver", "You can reactivate at any time"]}
            tone="danger"
            variant="ghost"
            disabled={busy}
            onConfirm={() => run(() => services.drivers.setStatus(actor!, driver.id, "SUSPENDED"), { success: "Driver suspended." })}
          />
        )}
        <p className="mt-3 text-xs text-muted">Current status: {titleCase(driver.status)}. The backend must enforce suspensions on every assignment request.</p>
      </Section>
    </div>
  );
}

export function DriverDetail({ id }: { id: string }) {
  const actor = useActor();
  const query = useServiceQuery(() => services.drivers.get(actor!, id), [actor?.id, id]);
  return (
    <div className="mt-6">
      <QueryBoundary query={query}>{(driver) => <DriverBody driver={driver} />}</QueryBoundary>
    </div>
  );
}
