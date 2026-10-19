"use client";

import { Notice } from "@/components/common/notices";
import { Section, StatGrid } from "@/components/common/layout-blocks";
import { StatusBadge } from "@/components/common/status-badge";
import { daysUntil, driverEligibility, expiryState, truckEligibility } from "@/config/business-rules";
import { DataTable, StatCard, ViewLink } from "@/components/ui";
import { useOps } from "@/hooks/use-ops";
import { formatDate, titleCase } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { ExpiryBadge } from "./document-list";
import { TextLink, useAdminLookups } from "./use-admin";

export function ExpiryMonitor() {
  const ops = useOps();
  const { trucks } = useIbanga();
  const { subject, userName, truckLabel } = useAdminLookups();
  const warning = ops.settings.documentWarningDays;

  const dated = ops.documents.filter((doc) => doc.expiryDate);
  const expired = dated.filter((doc) => expiryState(doc.expiryDate, warning) === "EXPIRED");
  const expiring = dated.filter((doc) => expiryState(doc.expiryDate, warning) === "EXPIRING");
  const soonest = [...dated].sort((a, b) => a.expiryDate!.localeCompare(b.expiryDate!));

  // Only the expiry-related reasons matter on this screen.
  const blockedTrucks = trucks
    .map((truck) => ({ truck, result: truckEligibility(ops.truckProfiles.find((item) => item.truckId === truck.id), ops.documents) }))
    .filter((item) => item.result.reasons.some((reason) => reason.includes("expired")));
  const blockedDrivers = ops.drivers
    .map((driver) => ({ driver, result: driverEligibility(driver, ops.documents) }))
    .filter((item) => item.result.reasons.some((reason) => reason.includes("expired")));

  return (
    <div className="mt-6 space-y-5">
      <Notice tone="warning" title="Restrictions must be enforced by the backend">
        This screen shows which trucks and drivers would be blocked. A real system must refuse quotes and assignments for expired documents on the server, not only hide buttons.
      </Notice>
      <StatGrid>
        <StatCard label="Expired" value={expired.length} hint="Past expiry date" accent="bad" />
        <StatCard label="Expiring soon" value={expiring.length} hint={`Within ${warning} days`} accent="warn" />
        <StatCard label="Trucks ineligible" value={blockedTrucks.length} hint="Expired document" accent="bad" />
        <StatCard label="Drivers ineligible" value={blockedDrivers.length} hint="Expired licence or document" accent="bad" />
      </StatGrid>

      <Section title="Made ineligible by expiry" description="These cannot quote or be assigned until corrected documents are approved.">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-navy">Trucks</h3>
            {blockedTrucks.length ? (
              <ul className="space-y-2 text-sm">
                {blockedTrucks.map(({ truck, result }) => (
                  <li key={truck.id}>
                    <TextLink href={`/dashboard/admin/trucks/${truck.id}`}>{truckLabel(truck.id)}</TextLink>
                    <span className="block text-xs text-muted">{userName(truck.ownerId)} · {result.reasons.filter((reason) => reason.includes("expired")).join(" ")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No truck is blocked by an expired document.</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-navy">Drivers</h3>
            {blockedDrivers.length ? (
              <ul className="space-y-2 text-sm">
                {blockedDrivers.map(({ driver, result }) => (
                  <li key={driver.id}>
                    <TextLink href={`/dashboard/admin/drivers/${driver.id}`}>{driver.name}</TextLink>
                    <span className="block text-xs text-muted">{userName(driver.ownerId)} · {result.reasons.filter((reason) => reason.includes("expired")).join(" ")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No driver is blocked by an expired licence.</p>
            )}
          </div>
        </div>
      </Section>

      <DataTable
        columns={[{ label: "Document" }, { label: "Owner" }, { label: "Subject" }, { label: "Expiry" }, { label: "Days remaining" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
        filterLabel="All expiry states"
        extraFilterLabel="All document types"
        exportName="ibanga-document-expiry"
        emptyMessage="No documents match."
        rows={soonest.map((doc) => {
          const who = subject(doc.subjectKind, doc.subjectId);
          const state = expiryState(doc.expiryDate, warning);
          const days = doc.expiryDate ? daysUntil(doc.expiryDate) : undefined;
          return {
            id: doc.id,
            searchText: `${doc.title} ${doc.ref} ${userName(doc.ownerId)} ${who.label} ${titleCase(doc.type)}`,
            filterValue: state,
            extraFilterValue: doc.type,
            exportValues: [doc.title, userName(doc.ownerId), `${titleCase(doc.subjectKind)}: ${who.label}`, formatDate(doc.expiryDate), days === undefined ? "" : String(days), state, ""],
            cells: [
              <span key="d"><strong className="block">{doc.title}</strong><span className="text-xs text-muted">{titleCase(doc.type)} · {doc.ref}</span></span>,
              userName(doc.ownerId),
              <span key="s"><span className="block">{who.label}</span><span className="text-xs text-muted">{titleCase(doc.subjectKind)}</span></span>,
              formatDate(doc.expiryDate),
              days === undefined ? "—" : days < 0 ? `${Math.abs(days)} overdue` : days,
              <span key="b" className="flex flex-col items-start gap-1"><ExpiryBadge expiryDate={doc.expiryDate} /><StatusBadge family="verification" status={doc.status} /></span>,
              <div key="a" className="flex justify-end">{doc.subjectKind === "USER" ? <span className="text-xs text-muted">Owner account</span> : <ViewLink href={who.href} label={`View ${who.label}`} />}</div>,
            ],
          };
        })}
      />
    </div>
  );
}
