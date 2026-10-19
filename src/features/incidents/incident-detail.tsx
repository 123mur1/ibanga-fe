"use client";

import Link from "next/link";
import { QueryBoundary } from "@/components/common/async-state";
import { controlClass, FormField } from "@/components/common/form-fields";
import { BackLink, DetailList, Section, Timeline } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { PageHeader, PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDateTime, titleCase } from "@/lib/format";
import { applyFieldErrors, useZodForm } from "@/lib/forms";
import { services } from "@/services";
import type { Incident } from "@/types/ops";
import { ClaimPanel } from "./claim-panel";
import { updateSchema } from "./schemas";

export function IncidentDetail({ id }: { id: string }) {
  const actor = useActor();
  const query = useServiceQuery(() => services.incidents.get(actor!, id), [actor?.id, id]);
  return (
    <div className="space-y-5">
      <BackLink href="/dashboard/owner/incidents">All incidents</BackLink>
      <QueryBoundary query={query} loadingLabel="Loading incident">{(incident) => <Content incident={incident} />}</QueryBoundary>
    </div>
  );
}

function Content({ incident }: { incident: Incident }) {
  const { shipments } = useOps();
  const shipment = shipments.find((item) => item.id === incident.shipmentId);
  const open = !["RESOLVED", "CLOSED"].includes(incident.status);
  return (
    <>
      <PageHeader
        eyebrow="Incident"
        title={incident.ref}
        subtitle={`${titleCase(incident.type)} at ${incident.location}`}
        actions={
          <>
            <StatusBadge family="severity" status={incident.severity} />
            <StatusBadge family="incident" status={incident.status} />
          </>
        }
      />
      {open ? <Notice tone="warning" title="Settlement hold">This incident holds the settlement for its shipment until an administrator resolves it.</Notice> : null}
      <Section title="Report">
        <DetailList
          items={[
            { label: "Shipment", value: shipment ? <Link className="text-brand hover:underline" href={`/dashboard/owner/shipments/${shipment.id}`}>{shipment.ref}</Link> : "—" },
            { label: "Occurred", value: formatDateTime(incident.occurredAt) },
            { label: "Cargo condition", value: titleCase(incident.cargoCondition) },
            { label: "People involved", value: incident.peopleInvolved || "—" },
            { label: "Description", value: incident.description, wide: true },
            { label: "Immediate action", value: incident.immediateAction, wide: true },
            { label: "Assistance needed", value: incident.assistanceNeeded || "—", wide: true },
            { label: "Responsible party", value: incident.responsibleParty ?? "Not determined yet" },
            { label: "Resolution", value: incident.resolution ?? "Not resolved yet" },
          ]}
        />
      </Section>
      <Section title="Evidence">
        {incident.evidence.length ? (
          <ul className="grid gap-3 sm:grid-cols-3">
            {incident.evidence.map((file, index) => (
              <li key={`${file.name}-${index}`} className="overflow-hidden rounded-lg border border-line bg-white">
                {file.url.startsWith("data:image") || /\.(png|jpe?g|webp|gif)$/i.test(file.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.url} alt={file.name} className="h-28 w-full object-cover" />
                ) : null}
                <a href={file.url} target="_blank" rel="noreferrer" download={file.name} className="block truncate px-3 py-2 text-xs font-semibold text-brand hover:underline" title={file.name}>{file.name}</a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No files were attached.</p>
        )}
      </Section>
      <ClaimPanel incident={incident} />
      <Section title="Timeline">
        <div className="space-y-5">
          <Timeline
            empty="No updates yet."
            entries={[...incident.timeline].reverse().map((entry, index) => ({ id: `${entry.at}-${index}`, title: entry.text, at: formatDateTime(entry.at) }))}
          />
          {incident.status !== "CLOSED" ? <UpdateForm incidentId={incident.id} /> : null}
        </div>
      </Section>
    </>
  );
}

function UpdateForm({ incidentId }: { incidentId: string }) {
  const actor = useActor();
  const { run, busy } = useAction();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useZodForm(updateSchema, { defaultValues: { text: "" } });
  const submit = handleSubmit(async (values) => {
    if (!actor) return;
    const done = await run(() => services.incidents.addTimeline(actor, incidentId, values.text), {
      success: "Update added.",
      onError: (_e, fields) => applyFieldErrors(setError, fields),
    });
    if (done) reset();
  });
  return (
    <form onSubmit={submit} noValidate className="space-y-3 border-t border-line pt-4">
      <FormField label="Add an update" error={errors.text?.message}>
        <textarea className={`${controlClass} min-h-20`} aria-invalid={Boolean(errors.text)} {...register("text")} />
      </FormField>
      <PrimaryButton type="submit" disabled={busy}>{busy ? "Adding…" : "Add update"}</PrimaryButton>
    </form>
  );
}
