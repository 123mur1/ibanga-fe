"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { controlClass } from "@/components/common/form-fields";
import { BackLink, DetailList, Section } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { PageHeader, PrimaryButton } from "@/components/ui";
import { driverEligibility, expiryState } from "@/config/business-rules";
import { DocumentList } from "@/features/owner-fleet/document-list";
import { EligibilityPanel } from "@/features/owner-fleet/eligibility-panel";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate, formatPercent } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { Driver, DriverStatus } from "@/types/ops";
import { AssignmentsPanel } from "./assignments-panel";

export function DriverDetail() {
  const { id } = useParams<{ id: string }>();
  const actor = useActor();
  const query = useServiceQuery(() => services.drivers.get(actor!, id), [actor?.id, id]);
  return (
    <>
      <BackLink href="/dashboard/owner/drivers">Drivers</BackLink>
      <div className="mt-4">
        <QueryBoundary query={query}>{(driver) => <DriverView driver={driver} />}</QueryBoundary>
      </div>
    </>
  );
}

function DriverView({ driver }: { driver: Driver }) {
  const ops = useOps();
  const { trucks } = useIbanga();
  const documents = ops.documents.filter((doc) => doc.subjectKind === "DRIVER" && doc.subjectId === driver.id);
  const eligibility = driverEligibility(driver, ops.documents);
  const licence = expiryState(driver.licenceExpiry);
  const licenceDoc = documents.find((doc) => doc.type === "DRIVER_LICENCE");
  const truck = trucks.find((item) => item.id === driver.assignedTruckId);
  const documentIssue = !licenceDoc || licenceDoc.status !== "APPROVED" || licence === "EXPIRED";

  return (
    <>
      <PageHeader
        eyebrow={driver.ref}
        title={driver.name}
        subtitle={`${driver.phone} · licence ${driver.licenceNumber} (category ${driver.licenceCategory})`}
        actions={
          <>
            <StatusBadge family="driver" status={driver.status} />
            <StatusBadge family="verification" status={driver.verification} />
            <Link href={`/dashboard/owner/drivers/${driver.id}/edit`} className="inline-flex items-center rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-brand/40">
              Edit driver
            </Link>
          </>
        }
      />

      <div className="mt-6 space-y-3">
        {documentIssue ? (
          <Notice tone="warning" title="Verification documents need attention">
            {!licenceDoc ? "No licence document is on file. " : licenceDoc.status !== "APPROVED" ? `The licence document is ${licenceDoc.status.toLowerCase().replace("_", " ")}. ` : ""}
            {licence === "EXPIRED" ? "The licence has expired. " : licence === "EXPIRING" ? "The licence expires soon. " : ""}
            Upload a current licence from the edit page; an administrator must verify it before this driver can take work.
          </Notice>
        ) : licence === "EXPIRING" ? (
          <Notice tone="warning" title="Licence expires soon">The licence expires on {formatDate(driver.licenceExpiry)}. Renew it to avoid being blocked.</Notice>
        ) : null}
        <EligibilityPanel result={eligibility} subject="driver" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,1fr)]">
        <div className="space-y-5">
          <AssignmentsPanel driver={driver} />
        </div>
        <aside className="space-y-5">
          <Section title="Profile">
            <DetailList
              columns={1}
              items={[
                { label: "Phone", value: driver.phone },
                { label: "Email", value: driver.email ?? "—" },
                { label: "National ID", value: driver.nationalId },
                { label: "Licence expiry", value: <span className="flex items-center gap-2">{formatDate(driver.licenceExpiry)}<StatusBadge family="documentExpiry" status={licence} /></span> },
                { label: "Usual truck", value: truck ? truck.plateNumber : "Unassigned" },
                { label: "Trips completed", value: driver.tripsCompleted },
                { label: "On-time rate", value: driver.tripsCompleted ? formatPercent(driver.onTimeRate) : "No trips yet" },
                { label: "Rating", value: driver.rating ? `${driver.rating.toFixed(1)} / 5` : "Not rated yet" },
                { label: "Joined", value: formatDate(driver.joinedAt) },
              ]}
            />
          </Section>
          <AvailabilityControl driver={driver} />
          <Section title="Documents">
            <DocumentList documents={documents} empty="No licence document uploaded. Add one from the edit page." />
          </Section>
        </aside>
      </div>
    </>
  );
}

function AvailabilityControl({ driver }: { driver: Driver }) {
  const actor = useActor();
  const { run, busy } = useAction();
  const [status, setStatus] = useState<DriverStatus>(driver.status === "OFF_DUTY" ? "OFF_DUTY" : "AVAILABLE");
  const locked = driver.status === "ON_TRIP" || driver.status === "SUSPENDED";

  return (
    <Section title="Availability" description="Off-duty drivers cannot be assigned new work.">
      {locked ? (
        <Notice tone={driver.status === "SUSPENDED" ? "danger" : "info"}>
          {driver.status === "ON_TRIP" ? "This driver is on an active trip. Change the driver on the assignment first." : "This driver is suspended. Contact support to lift the suspension."}
        </Notice>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-40 flex-1 text-sm font-medium text-navy">
            Status
            <select className={`${controlClass} mt-1.5`} value={status} onChange={(event) => setStatus(event.target.value as DriverStatus)}>
              <option value="AVAILABLE">Available</option>
              <option value="OFF_DUTY">Off duty</option>
            </select>
          </label>
          <PrimaryButton
            type="button"
            disabled={busy || !actor || status === driver.status}
            onClick={() => actor && void run(() => services.drivers.setStatus(actor, driver.id, status), { success: "Availability updated." })}
          >
            {busy ? "Saving…" : "Update"}
          </PrimaryButton>
        </div>
      )}
    </Section>
  );
}
