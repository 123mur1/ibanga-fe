"use client";

import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { controlClass, FormField } from "@/components/common/form-fields";
import { Section } from "@/components/common/layout-blocks";
import { StatusBadge } from "@/components/common/status-badge";
import { expiryState } from "@/config/business-rules";
import { GhostButton, PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate, formatRwf } from "@/lib/format";
import { applyFieldErrors, useZodForm } from "@/lib/forms";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { InsurancePolicy } from "@/types/ops";
import { policySchema } from "./schemas";

function PolicyForm({ policy, onDone }: { policy?: InsurancePolicy; onDone: () => void }) {
  const actor = useActor();
  const { trucks, currentUser } = useIbanga();
  const { run, busy } = useAction();
  const myTrucks = trucks.filter((truck) => truck.ownerId === currentUser?.id);
  const { register, handleSubmit, setError, formState: { errors } } = useZodForm(policySchema, {
    defaultValues: {
      truckId: policy?.truckId ?? myTrucks[0]?.id ?? "",
      provider: policy?.provider ?? "",
      policyNumber: policy?.policyNumber ?? "",
      coverageRwf: policy ? String(policy.coverageRwf) : "",
      coverageNotes: policy?.coverageNotes ?? "",
      issueDate: policy?.issueDate ?? "",
      expiryDate: policy?.expiryDate ?? "",
    },
  });

  const submit = handleSubmit(async (values) => {
    if (!actor) return;
    const saved = await run(
      () =>
        services.documents.savePolicy(actor, {
          id: policy?.id,
          documentId: policy?.documentId,
          truckId: values.truckId,
          provider: values.provider,
          policyNumber: values.policyNumber,
          coverageRwf: Number(values.coverageRwf),
          coverageNotes: values.coverageNotes ?? "",
          issueDate: values.issueDate,
          expiryDate: values.expiryDate,
        }),
      { success: policy ? "Policy updated." : "Policy saved.", onError: (_error, fields) => applyFieldErrors(setError, fields) },
    );
    if (saved) onDone();
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4 border-t border-line pt-5">
      <h3 className="font-semibold text-navy">{policy ? "Edit policy" : "Add an insurance policy"}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Truck" required error={errors.truckId?.message}>
          <select className={controlClass} {...register("truckId")}>
            {myTrucks.length === 0 ? <option value="">No trucks yet</option> : null}
            {myTrucks.map((truck) => <option key={truck.id} value={truck.id}>{truck.plateNumber} · {truck.truckType}</option>)}
          </select>
        </FormField>
        <FormField label="Provider" required error={errors.provider?.message}><input className={controlClass} aria-invalid={Boolean(errors.provider)} {...register("provider")} /></FormField>
        <FormField label="Policy number" required error={errors.policyNumber?.message}><input className={controlClass} aria-invalid={Boolean(errors.policyNumber)} {...register("policyNumber")} /></FormField>
        <FormField label="Coverage (RWF)" required error={errors.coverageRwf?.message}><input inputMode="numeric" className={controlClass} aria-invalid={Boolean(errors.coverageRwf)} {...register("coverageRwf")} /></FormField>
        <FormField label="Issue date" required error={errors.issueDate?.message}><input type="date" className={controlClass} {...register("issueDate")} /></FormField>
        <FormField label="Expiry date" required error={errors.expiryDate?.message}><input type="date" className={controlClass} aria-invalid={Boolean(errors.expiryDate)} {...register("expiryDate")} /></FormField>
      </div>
      <FormField label="Coverage notes" error={errors.coverageNotes?.message}><textarea className={`${controlClass} min-h-20 resize-y`} {...register("coverageNotes")} /></FormField>
      <div className="flex gap-3">
        <PrimaryButton type="submit" disabled={busy || myTrucks.length === 0}>{busy ? "Saving…" : "Save policy"}</PrimaryButton>
        <GhostButton type="button" disabled={busy} onClick={onDone}>Cancel</GhostButton>
      </div>
    </form>
  );
}

/** Insurance policies per truck. Saved policy details do not count as an approved insurance document. */
export function PolicyManager() {
  const actor = useActor();
  const { trucks } = useIbanga();
  const { settings } = useOps();
  const query = useServiceQuery(() => services.documents.listPolicies(actor!), [actor?.id]);
  const [editing, setEditing] = useState<InsurancePolicy | "new" | null>(null);

  return (
    <Section
      title="Insurance policies"
      description="Record the policy for each truck. Upload the policy certificate above as an “Insurance policy” document so it can be approved."
      actions={editing ? null : <PrimaryButton type="button" onClick={() => setEditing("new")}>Add policy</PrimaryButton>}
    >
      <QueryBoundary query={query} isEmpty={(items) => items.length === 0 && !editing} empty={{ title: "No insurance policies", text: "Add a policy for each truck. Trucks need insurance to be eligible for work." }}>
        {(policies) => (
          <div className="space-y-4">
            {policies.length ? (
              <ul className="divide-y divide-line rounded-xl border border-line">
                {policies.map((policy) => {
                  const state = expiryState(policy.expiryDate, settings.documentWarningDays);
                  return (
                    <li key={policy.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-semibold text-navy">{policy.provider} · {policy.policyNumber}</p>
                        <p className="text-xs text-muted">
                          {trucks.find((truck) => truck.id === policy.truckId)?.plateNumber ?? policy.truckId} · Covers {formatRwf(policy.coverageRwf)} · {formatDate(policy.issueDate)} to {formatDate(policy.expiryDate)}
                        </p>
                        {policy.coverageNotes ? <p className="mt-1 text-sm text-muted">{policy.coverageNotes}</p> : null}
                      </div>
                      <div className="flex items-center gap-2">
                        {state === "EXPIRING" || state === "EXPIRED" ? <StatusBadge family="documentExpiry" status={state} /> : <StatusBadge family="documentExpiry" status="VALID" />}
                        <GhostButton type="button" onClick={() => setEditing(policy)}>Edit</GhostButton>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {editing ? <PolicyForm key={editing === "new" ? "new" : editing.id} policy={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} /> : null}
          </div>
        )}
      </QueryBoundary>
    </Section>
  );
}
