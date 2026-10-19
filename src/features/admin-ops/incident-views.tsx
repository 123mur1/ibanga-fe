"use client";

import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { ConfirmButton } from "@/components/common/confirm-button";
import { controlClass, FormField } from "@/components/common/form-fields";
import { DetailList, Section, StatGrid, Timeline } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, GhostButton, StatCard, ViewLink } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { useZodForm } from "@/lib/forms";
import { formatDate, formatDateTime, formatRwf, titleCase } from "@/lib/format";
import { services } from "@/services";
import type { Incident } from "@/types/ops";
import { INCIDENT_STATUSES, incidentStatusSchema, timelineSchema } from "./schemas";
import { TextLink, useAdminLookups } from "./use-admin";

export function IncidentList() {
  const actor = useActor();
  const { truckLabel } = useAdminLookups();
  const [severity, setSeverity] = useState("");
  const query = useServiceQuery(() => services.incidents.list(actor!, { pageSize: 500 }), [actor?.id]);

  return (
    <div className="mt-6">
      <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0} empty={{ title: "No incidents reported", text: "Owners report accidents, breakdowns and cargo problems from their shipments." }}>
        {(data) => {
          const open = data.items.filter((item) => !["RESOLVED", "CLOSED"].includes(item.status));
          const critical = open.filter((item) => item.severity === "CRITICAL" || item.severity === "HIGH").length;
          const items = data.items.filter((item) => !severity || item.severity === severity).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          return (
            <>
              <StatGrid>
                <StatCard label="Incidents" value={data.total} hint="All time" />
                <StatCard label="Open" value={open.length} hint="Hold the settlement" accent="warn" />
                <StatCard label="High or critical" value={critical} hint="Open, needs attention" accent="bad" />
                <StatCard label="Resolved" value={data.items.filter((item) => item.status === "RESOLVED" || item.status === "CLOSED").length} hint="Resolved or closed" accent="good" />
              </StatGrid>
              <div className="mt-5 max-w-xs">
                <FormField label="Severity">
                  <select className={controlClass} value={severity} onChange={(event) => setSeverity(event.target.value)}>
                    <option value="">All severities</option>
                    {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}
                  </select>
                </FormField>
              </div>
              <div className="mt-3">
                <DataTable
                  columns={[{ label: "Incident" }, { label: "Truck" }, { label: "Occurred" }, { label: "Location" }, { label: "Severity" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
                  filterLabel="All statuses"
                  extraFilterLabel="All types"
                  exportName="ibanga-admin-incidents"
                  emptyMessage="No incidents match."
                  rows={items.map((item) => ({
                    id: item.id,
                    searchText: `${item.ref} ${titleCase(item.type)} ${truckLabel(item.truckId)} ${item.location} ${item.description}`,
                    filterValue: item.status,
                    extraFilterValue: item.type,
                    exportValues: [item.ref, titleCase(item.type), truckLabel(item.truckId), formatDate(item.occurredAt), item.location, item.severity, item.status, ""],
                    cells: [
                      <span key="i"><strong className="block">{titleCase(item.type)}</strong><span className="text-xs text-muted">{item.ref}</span></span>,
                      truckLabel(item.truckId),
                      formatDate(item.occurredAt),
                      item.location,
                      <StatusBadge key="sev" family="severity" status={item.severity} />,
                      <StatusBadge key="s" family="incident" status={item.status} />,
                      <div key="a" className="flex justify-end"><ViewLink href={`/dashboard/admin/incidents/${item.id}`} label={`View incident ${item.ref}`} /></div>,
                    ],
                  }))}
                />
              </div>
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}

function TimelineForm({ incident }: { incident: Incident }) {
  const actor = useActor();
  const { run, busy } = useAction();
  const { register, handleSubmit, reset, formState } = useZodForm(timelineSchema, { defaultValues: { text: "" } });
  const submit = handleSubmit(async (values) => {
    const result = await run(() => services.incidents.addTimeline(actor!, incident.id, values.text), { success: "Timeline entry added." });
    if (result) reset();
  });
  return (
    <form onSubmit={submit} noValidate className="mt-5 space-y-3 border-t border-line pt-4">
      <FormField label="Add a timeline entry" required error={formState.errors.text?.message}>
        <textarea rows={2} className={controlClass} {...register("text")} disabled={busy} aria-invalid={Boolean(formState.errors.text)} />
      </FormField>
      <GhostButton type="submit" disabled={busy}>{busy ? "Adding…" : "Add entry"}</GhostButton>
    </form>
  );
}

function StatusForm({ incident }: { incident: Incident }) {
  const actor = useActor();
  const { run, busy } = useAction();
  const { register, watch, trigger, getValues, formState } = useZodForm(incidentStatusSchema, {
    defaultValues: { status: incident.status, resolution: incident.resolution ?? "", responsibleParty: incident.responsibleParty ?? "" },
  });
  const status = watch("status");
  const needsResolution = status === "RESOLVED" || status === "CLOSED";
  const unchanged = status === incident.status && getValues("resolution") === (incident.resolution ?? "") && getValues("responsibleParty") === (incident.responsibleParty ?? "");

  async function apply() {
    const values = getValues();
    await run(
      () => services.incidents.setStatus(actor!, incident.id, values.status, values.resolution.trim() || undefined, values.responsibleParty.trim() || undefined),
      { success: `Incident marked ${titleCase(values.status)}.` },
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Status" required error={formState.errors.status?.message}>
          <select className={controlClass} {...register("status")} disabled={busy}>
            {INCIDENT_STATUSES.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}
          </select>
        </FormField>
        <FormField label="Responsible party" hint="For example the driver, owner, a third party or weather." error={formState.errors.responsibleParty?.message}>
          <input className={controlClass} {...register("responsibleParty")} disabled={busy} />
        </FormField>
      </div>
      <FormField label="Resolution" required={needsResolution} hint={needsResolution ? undefined : "Required to resolve or close."} error={formState.errors.resolution?.message}>
        <textarea rows={3} className={controlClass} {...register("resolution")} disabled={busy} aria-invalid={Boolean(formState.errors.resolution)} />
      </FormField>
      <ConfirmButton
        label="Update status"
        title={`Mark incident ${titleCase(status)}?`}
        message="This changes the incident record."
        summary={needsResolution ? ["The settlement hold from this incident is released", "The resolution is stored on the incident"] : ["The incident keeps holding the shipment's settlement while open"]}
        disabled={busy || unchanged}
        onConfirm={async () => {
          if (await trigger()) await apply();
        }}
      />
    </div>
  );
}

function IncidentBody({ incident }: { incident: Incident }) {
  const ops = useOps();
  const { userName, truckLabel, driverName } = useAdminLookups();
  const claim = ops.insuranceClaims.find((item) => item.incidentId === incident.id);
  const shipment = ops.shipments.find((item) => item.id === incident.shipmentId);
  const open = !["RESOLVED", "CLOSED"].includes(incident.status);

  return (
    <div className="space-y-5">
      {open ? <Notice tone="warning" title="Settlement hold">This unresolved incident holds the settlement for its shipment{shipment ? ` ${shipment.ref}` : ""}.</Notice> : null}
      <Section title="Incident" actions={<span className="flex gap-2"><StatusBadge family="severity" status={incident.severity} /><StatusBadge family="incident" status={incident.status} /></span>}>
        <DetailList
          items={[
            { label: "Reference", value: incident.ref },
            { label: "Type", value: titleCase(incident.type) },
            { label: "Occurred", value: formatDateTime(incident.occurredAt) },
            { label: "Location", value: incident.location },
            { label: "Reported by", value: userName(incident.reportedBy) },
            { label: "Truck", value: <TextLink href={`/dashboard/admin/trucks/${incident.truckId}`}>{truckLabel(incident.truckId)}</TextLink> },
            { label: "Driver", value: incident.driverId ? <TextLink href={`/dashboard/admin/drivers/${incident.driverId}`}>{driverName(incident.driverId)}</TextLink> : "—" },
            { label: "Shipment", value: shipment ? <TextLink href={`/dashboard/admin/shipments/${shipment.id}`}>{shipment.ref}</TextLink> : incident.shipmentId },
            { label: "Cargo condition", value: titleCase(incident.cargoCondition) },
            { label: "People involved", value: incident.peopleInvolved || "—" },
            { label: "Description", value: incident.description, wide: true },
            { label: "Immediate action", value: incident.immediateAction || "—", wide: true },
            { label: "Assistance needed", value: incident.assistanceNeeded || "—", wide: true },
            { label: "Responsible party", value: incident.responsibleParty ?? "Not assigned" },
            { label: "Resolution", value: incident.resolution ?? "Not resolved", wide: true },
          ]}
        />
      </Section>

      <Section title="Evidence">
        {incident.evidence.length ? (
          <ul className="grid gap-3 sm:grid-cols-3">
            {incident.evidence.map((file, index) => (
              <li key={`${file.name}-${index}`} className="overflow-hidden rounded-lg border border-line bg-white text-xs">
                {file.url.startsWith("data:image/") || /\.(png|jpe?g|webp|gif)$/i.test(file.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.url} alt={`Evidence ${file.name}`} className="h-28 w-full object-cover" />
                ) : null}
                <a href={file.url} target="_blank" rel="noreferrer" className="block truncate px-2.5 py-2 font-semibold text-brand hover:text-brand-dark">{file.name}</a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No evidence was attached.</p>
        )}
      </Section>

      <Section title="Insurance claim" description="A claim is a request, not an approval or a payment.">
        <div className="mt-3 text-sm">
          {claim ? (
            <div className="space-y-2">
              <p className="flex flex-wrap items-center gap-2"><strong className="text-navy">{claim.ref}</strong> <StatusBadge family="claim" status={claim.status} /></p>
              <p className="text-muted">{claim.provider} · policy {claim.policyNumber} · cover {formatRwf(claim.coverageRwf)}</p>
              <p>Claimed {formatRwf(claim.claimedAmountRwf)} on {formatDate(claim.filedAt)}</p>
              {claim.decisionNote ? <p className="text-muted">Decision note: {claim.decisionNote}</p> : null}
              <TextLink href="/dashboard/admin/insurance-claims">Open insurance claims</TextLink>
            </div>
          ) : (
            <p className="text-muted">No insurance claim has been filed for this incident.</p>
          )}
        </div>
      </Section>

      <Section title="Timeline">
        <Timeline
          empty="No timeline entries yet."
          entries={[...incident.timeline].sort((a, b) => a.at.localeCompare(b.at)).map((entry, index) => ({ id: `${entry.at}-${index}`, title: entry.text, detail: userName(entry.by), at: formatDateTime(entry.at) }))}
        />
        <TimelineForm incident={incident} />
      </Section>

      <Section title="Status and resolution">
        <StatusForm key={`${incident.status}-${incident.resolution ?? ""}`} incident={incident} />
      </Section>
    </div>
  );
}

export function IncidentDetail({ id }: { id: string }) {
  const actor = useActor();
  const query = useServiceQuery(() => services.incidents.get(actor!, id), [actor?.id, id]);
  return (
    <div className="mt-6">
      <QueryBoundary query={query}>{(incident) => <IncidentBody incident={incident} />}</QueryBoundary>
    </div>
  );
}
