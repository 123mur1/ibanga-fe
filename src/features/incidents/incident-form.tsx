"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { controlClass, FilePicker, FormField } from "@/components/common/form-fields";
import { Section } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { applyFieldErrors, useZodForm, type PickedFile } from "@/lib/forms";
import { formatDate, titleCase } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import { CONDITIONS, INCIDENT_TYPES, incidentSchema, SEVERITIES } from "./schemas";

export function IncidentForm({ initialShipmentId }: { initialShipmentId: string }) {
  const actor = useActor();
  const query = useServiceQuery(() => services.shipments.list(actor!, { pageSize: 500 }), [actor?.id]);
  return (
    <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0} empty={{ title: "No shipments to report on", text: "Incidents are reported against one of your shipments." }}>
      {(data) => <Form shipments={data.items} initialShipmentId={initialShipmentId} />}
    </QueryBoundary>
  );
}

type ShipmentItem = Awaited<ReturnType<typeof services.shipments.list>>["items"][number];

function Form({ shipments, initialShipmentId }: { shipments: ShipmentItem[]; initialShipmentId: string }) {
  const actor = useActor();
  const router = useRouter();
  const { bookings } = useIbanga();
  const { run, busy } = useAction();
  const [files, setFiles] = useState<PickedFile[]>([]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useZodForm(incidentSchema, {
    defaultValues: {
      shipmentId: shipments.some((item) => item.id === initialShipmentId) ? initialShipmentId : "",
      type: "BREAKDOWN",
      severity: "MEDIUM",
      occurredAt: "",
      location: "",
      description: "",
      peopleInvolved: "",
      cargoCondition: "INTACT",
      immediateAction: "",
      assistanceNeeded: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    const shipment = shipments.find((item) => item.id === values.shipmentId);
    if (!actor || !shipment) return;
    const incident = await run(
      () =>
        services.incidents.report(actor, {
          ...values,
          truckId: shipment.truckId,
          driverId: shipment.driverId,
          occurredAt: new Date(values.occurredAt).toISOString(),
          evidence: files.map((file) => ({ name: file.name, url: file.url })),
        }),
      { success: "Incident reported. The shipment's settlement is now on hold.", onError: (_e, fields) => applyFieldErrors(setError, fields) },
    );
    if (incident) router.push(`/dashboard/owner/incidents/${incident.id}`);
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Notice tone="info" title="In an emergency, contact emergency services first">This form records the incident for iBanga and the importer. It does not dispatch help.</Notice>
      <Section title="What happened">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Shipment" required error={errors.shipmentId?.message} className="sm:col-span-2">
            <select className={controlClass} aria-invalid={Boolean(errors.shipmentId)} {...register("shipmentId")}>
              <option value="">Choose a shipment</option>
              {shipments.map((shipment) => {
                const booking = bookings.find((item) => item.id === shipment.bookingId);
                return (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.ref} {booking ? `${booking.pickupLocation} to ${booking.destination}` : ""} ({titleCase(shipment.status)}, {formatDate(shipment.createdAt)})
                  </option>
                );
              })}
            </select>
          </FormField>
          <FormField label="Type" required error={errors.type?.message}>
            <select className={controlClass} {...register("type")}>
              {INCIDENT_TYPES.map((type) => <option key={type} value={type}>{titleCase(type)}</option>)}
            </select>
          </FormField>
          <FormField label="Severity" required error={errors.severity?.message}>
            <select className={controlClass} {...register("severity")}>
              {SEVERITIES.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
            </select>
          </FormField>
          <FormField label="Date and time" required error={errors.occurredAt?.message}>
            <input type="datetime-local" className={controlClass} aria-invalid={Boolean(errors.occurredAt)} {...register("occurredAt")} />
          </FormField>
          <FormField label="Location" required error={errors.location?.message}>
            <input className={controlClass} aria-invalid={Boolean(errors.location)} {...register("location")} />
          </FormField>
          <FormField label="Description" required error={errors.description?.message} className="sm:col-span-2">
            <textarea className={`${controlClass} min-h-28`} aria-invalid={Boolean(errors.description)} {...register("description")} />
          </FormField>
          <FormField label="People involved" error={errors.peopleInvolved?.message}>
            <input className={controlClass} placeholder="Driver, other drivers, witnesses" {...register("peopleInvolved")} />
          </FormField>
          <FormField label="Cargo condition" required error={errors.cargoCondition?.message}>
            <select className={controlClass} {...register("cargoCondition")}>
              {CONDITIONS.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
            </select>
          </FormField>
        </div>
      </Section>
      <Section title="Response and evidence">
        <div className="grid gap-4">
          <FormField label="Immediate action taken" required error={errors.immediateAction?.message}>
            <textarea className={`${controlClass} min-h-20`} aria-invalid={Boolean(errors.immediateAction)} {...register("immediateAction")} />
          </FormField>
          <FormField label="Assistance needed" error={errors.assistanceNeeded?.message}>
            <textarea className={`${controlClass} min-h-20`} placeholder="Tow truck, replacement driver, transfer of cargo..." {...register("assistanceNeeded")} />
          </FormField>
          <FilePicker label="Photos and documents" multiple files={files} onChange={setFiles} />
        </div>
      </Section>
      <Notice tone="warning" title="Reporting holds the settlement">An unresolved incident holds the settlement for this shipment until an administrator resolves it.</Notice>
      <PrimaryButton type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit incident report"}</PrimaryButton>
    </form>
  );
}
