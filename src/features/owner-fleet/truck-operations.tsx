"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmButton } from "@/components/common/confirm-button";
import { CheckRow, controlClass, FormField } from "@/components/common/form-fields";
import { DetailList, Section } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { PrimaryButton } from "@/components/ui";
import { truckEligibility } from "@/config/business-rules";
import { statusOf } from "@/config/status";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { applyFieldErrors, useZodForm } from "@/lib/forms";
import { formatDate, formatPercent } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { ACTIVE_BOOKING_STATUSES, type Truck } from "@/lib/types";
import { services } from "@/services";
import type { TruckOpsStatus, TruckProfile } from "@/types/ops";
import { EligibilityPanel } from "./eligibility-panel";
import { SUITABILITY_OPTIONS, truckProfileSchema } from "./schemas";
import { TruckDocuments } from "./truck-documents";

const STATUSES: TruckOpsStatus[] = ["AVAILABLE", "RESERVED", "IN_TRANSIT", "MAINTENANCE", "INACTIVE"];

/** Operations area for the truck detail page: status, dimensions, documents, eligibility, performance. */
export function TruckOperations({ truck }: { truck: Truck }) {
  const ops = useOps();
  const { bookings } = useIbanga();
  const profile = ops.truckProfiles.find((item) => item.truckId === truck.id);
  const eligibility = truckEligibility(profile, ops.documents);
  const active = bookings.filter((booking) => booking.truckId === truck.id && ACTIVE_BOOKING_STATUSES.includes(booking.status));
  const assignments = ops.driverAssignments.filter((item) => item.truckId === truck.id && ["ACTIVE", "UPCOMING"].includes(item.status));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl text-navy">Operations</h2>
        {profile ? <StatusBadge family="truckOps" status={profile.opsStatus} /> : null}
        {profile ? <StatusBadge family="verification" status={profile.verification} /> : null}
      </div>
      <EligibilityPanel result={eligibility} subject="truck" />
      <div className="grid gap-5 xl:grid-cols-2">
        <StatusControl truck={truck} profile={profile} activeCount={active.length} />
        <Performance profile={profile} />
      </div>
      <ProfileForm key={profile ? `${profile.truckId}-${profile.lengthM}-${profile.widthM}-${profile.heightM}-${profile.volumeM3}-${profile.suitability.join()}` : truck.id} truck={truck} profile={profile} />
      <TruckDocuments truckId={truck.id} plateNumber={truck.plateNumber} />
      <Section title="Assignments and bookings" description="Active work and drivers assigned to this truck.">
        {active.length === 0 && assignments.length === 0 ? (
          <p className="text-sm text-muted">Nothing is scheduled on this truck.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {active.map((booking) => (
              <li key={booking.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                <Link href={`/dashboard/owner/bookings/${booking.id}`} className="font-semibold text-navy hover:text-brand">{booking.pickupLocation} to {booking.destination}</Link>
                <StatusBadge family="booking" status={booking.status} />
              </li>
            ))}
            {assignments.map((item) => {
              const driver = ops.drivers.find((candidate) => candidate.id === item.driverId);
              return (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                  <span>
                    <Link href={`/dashboard/owner/drivers/${item.driverId}`} className="font-semibold text-navy hover:text-brand">{driver?.name ?? "Driver"}</Link>
                    <span className="text-muted"> · {formatDate(item.startDate)} to {formatDate(item.endDate)}</span>
                  </span>
                  <StatusBadge family="assignment" status={item.status} />
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Performance({ profile }: { profile?: TruckProfile }) {
  return (
    <Section title="Utilisation and performance" description="Demonstration figures, not measured data.">
      {profile ? (
        <DetailList
          columns={1}
          items={[
            { label: "Utilisation, last 30 days", value: formatPercent(profile.utilizationPct) },
            { label: "Trips completed", value: profile.tripsCompleted },
            { label: "On-time delivery rate", value: profile.tripsCompleted ? formatPercent(profile.onTimeRate) : "No trips yet" },
          ]}
        />
      ) : (
        <p className="text-sm text-muted">No operational profile yet. Save the dimensions below to create one.</p>
      )}
    </Section>
  );
}

function StatusControl({ truck, profile, activeCount }: { truck: Truck; profile?: TruckProfile; activeCount: number }) {
  const actor = useActor();
  const { run, busy } = useAction();
  const [next, setNext] = useState<TruckOpsStatus>(profile?.opsStatus ?? "AVAILABLE");
  const current = profile?.opsStatus;

  // Rules: a truck on a booking cannot be taken out of service, and "reserved" or "in transit" only make sense with one.
  const problem =
    (next === "INACTIVE" || next === "MAINTENANCE") && activeCount > 0
      ? `This truck has ${activeCount} active booking${activeCount === 1 ? "" : "s"}, so it cannot be set to ${statusOf("truckOps", next).label.toLowerCase()} yet.`
      : (next === "RESERVED" || next === "IN_TRANSIT") && activeCount === 0
        ? `Set “${statusOf("truckOps", next).label}” only while the truck is on a booking. It has none.`
        : next === "AVAILABLE" && current === "IN_TRANSIT"
          ? "The truck is in transit. Finish the trip from the booking first."
          : undefined;
  const outOfService = next === "INACTIVE" || next === "MAINTENANCE";

  const apply = () => (actor ? run(() => services.trucks.setOpsStatus(actor, truck.id, next), { success: `Status set to ${statusOf("truckOps", next).label}.` }) : undefined);

  return (
    <Section title="Operational status" description="Whether this truck can be quoted and booked.">
      <div className="space-y-3">
        <FormField label="Status">
          <select className={controlClass} value={next} onChange={(event) => setNext(event.target.value as TruckOpsStatus)}>
            {STATUSES.map((status) => <option key={status} value={status}>{statusOf("truckOps", status).label}</option>)}
          </select>
        </FormField>
        {problem ? <Notice tone="warning">{problem}</Notice> : null}
        {outOfService && !problem ? <Notice>A truck that is {statusOf("truckOps", next).label.toLowerCase()} cannot send quotations or take new work.</Notice> : null}
        {outOfService ? (
          <ConfirmButton
            label="Update status"
            title={`Set truck to ${statusOf("truckOps", next).label.toLowerCase()}?`}
            message={`${truck.plateNumber} will stop being eligible for new work.`}
            summary={["Existing quotations stay open until you withdraw them.", "You can set it back to available at any time."]}
            disabled={busy || next === current || Boolean(problem)}
            onConfirm={apply}
          />
        ) : (
          <PrimaryButton type="button" disabled={busy || next === current || Boolean(problem) || !actor} onClick={() => void apply()}>
            {busy ? "Saving…" : "Update status"}
          </PrimaryButton>
        )}
      </div>
    </Section>
  );
}

function ProfileForm({ truck, profile }: { truck: Truck; profile?: TruckProfile }) {
  const actor = useActor();
  const { run, busy } = useAction();
  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors },
  } = useZodForm(truckProfileSchema, {
    defaultValues: {
      lengthM: profile?.lengthM || undefined,
      widthM: profile?.widthM || undefined,
      heightM: profile?.heightM || undefined,
      volumeM3: profile?.volumeM3 || undefined,
      suitability: profile?.suitability ?? [],
    },
  });
  const selected = watch("suitability") ?? [];
  // Keep values saved earlier that are not among the standard options.
  const options = [...SUITABILITY_OPTIONS, ...selected.filter((item) => !(SUITABILITY_OPTIONS as readonly string[]).includes(item))];

  const submit = handleSubmit((values) => {
    if (!actor) return;
    return run(() => services.trucks.updateProfile(actor, truck.id, values), {
      success: "Dimensions and suitability saved.",
      onError: (_error, fields) => applyFieldErrors(setError, fields),
    });
  });

  return (
    <Section title="Dimensions and suitability" description="Importers and administrators use these to judge whether cargo fits.">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Length (m)" required error={errors.lengthM?.message}>
            <input className={controlClass} type="number" step="0.1" min={0} inputMode="decimal" aria-invalid={Boolean(errors.lengthM)} {...register("lengthM", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Width (m)" required error={errors.widthM?.message}>
            <input className={controlClass} type="number" step="0.1" min={0} inputMode="decimal" aria-invalid={Boolean(errors.widthM)} {...register("widthM", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Height (m)" required error={errors.heightM?.message}>
            <input className={controlClass} type="number" step="0.1" min={0} inputMode="decimal" aria-invalid={Boolean(errors.heightM)} {...register("heightM", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Load volume (m³)" required error={errors.volumeM3?.message}>
            <input className={controlClass} type="number" step="0.5" min={0} inputMode="decimal" aria-invalid={Boolean(errors.volumeM3)} {...register("volumeM3", { valueAsNumber: true })} />
          </FormField>
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-navy">Suitable for</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {options.map((option) => (
              <CheckRow
                key={option}
                title={option}
                checked={selected.includes(option)}
                onChange={(checked) => setValue("suitability", checked ? [...selected, option] : selected.filter((item) => item !== option), { shouldDirty: true })}
              />
            ))}
          </div>
        </fieldset>
        <PrimaryButton type="submit" disabled={busy || !actor}>{busy ? "Saving…" : "Save dimensions and suitability"}</PrimaryButton>
      </form>
    </Section>
  );
}
