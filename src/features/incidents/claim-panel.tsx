"use client";

import { QueryBoundary } from "@/components/common/async-state";
import { controlClass, FormField } from "@/components/common/form-fields";
import { DetailList, Section } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDateTime, formatRwf } from "@/lib/format";
import { applyFieldErrors, useZodForm } from "@/lib/forms";
import { services } from "@/services";
import type { Incident, InsuranceClaim, InsurancePolicy } from "@/types/ops";
import { claimSchema } from "./schemas";

export function ClaimPanel({ incident }: { incident: Incident }) {
  const actor = useActor();
  const query = useServiceQuery(
    async () => {
      const [claims, policies] = await Promise.all([services.incidents.listClaims(actor!, { pageSize: 500 }), services.documents.listPolicies(actor!)]);
      return { claim: claims.items.find((item) => item.incidentId === incident.id), policies: policies.filter((item) => item.truckId === incident.truckId) };
    },
    [actor?.id, incident.id, incident.truckId],
  );
  return (
    <Section title="Insurance claim" description="A claim is a request to your insurer. It is not an approval or a payment.">
      <QueryBoundary query={query} loadingLabel="Loading insurance details">
        {({ claim, policies }) => (claim ? <ClaimStatus claim={claim} /> : <ClaimForm incident={incident} policies={policies} />)}
      </QueryBoundary>
    </Section>
  );
}

function ClaimStatus({ claim }: { claim: InsuranceClaim }) {
  const simulated = claim.status === "APPROVED" || claim.status === "PAID_SIMULATED";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge family="claim" status={claim.status} />
        <span className="text-sm text-muted">{claim.ref}</span>
      </div>
      {claim.status === "SUBMITTED" ? <Notice tone="info">Submitted. Nothing has been decided yet.</Notice> : null}
      {claim.status === "UNDER_REVIEW" ? <Notice tone="info">Under review. No decision has been made.</Notice> : null}
      {simulated ? <Notice tone="warning" title="Simulated outcome">This decision is demonstration data. No insurer paid anything and no money moved.</Notice> : null}
      {claim.status === "REJECTED" ? <Notice tone="danger" title="Claim rejected">{claim.decisionNote ?? "No reason was recorded."}</Notice> : null}
      <DetailList
        items={[
          { label: "Provider", value: claim.provider },
          { label: "Policy number", value: claim.policyNumber },
          { label: "Claimed", value: formatRwf(claim.claimedAmountRwf) },
          { label: "Policy coverage", value: formatRwf(claim.coverageRwf) },
          { label: "Filed", value: formatDateTime(claim.filedAt) },
          { label: "Decided", value: claim.decidedAt ? formatDateTime(claim.decidedAt) : "Not decided" },
          { label: "Your notes", value: claim.notes || "—", wide: true },
          ...(claim.decisionNote && claim.status !== "REJECTED" ? [{ label: "Decision note", value: claim.decisionNote, wide: true }] : []),
        ]}
      />
    </div>
  );
}

function ClaimForm({ incident, policies }: { incident: Incident; policies: InsurancePolicy[] }) {
  const actor = useActor();
  const { run, busy } = useAction();
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useZodForm(claimSchema, { defaultValues: { policyId: policies.length === 1 ? policies[0].id : "", claimedAmountRwf: "", notes: "" } });
  const policy = policies.find((item) => item.id === watch("policyId"));
  const expired = (item: InsurancePolicy) => item.expiryDate < incident.occurredAt.slice(0, 10);

  if (!policies.length) {
    return <Notice tone="warning" title="No insurance policy on file for this truck" action={{ href: "/dashboard/owner/documents", label: "Insurance & documents" }}>Add the truck&apos;s policy before filing a claim.</Notice>;
  }

  const submit = handleSubmit(async (values) => {
    if (!actor) return;
    const amount = Number(values.claimedAmountRwf);
    if (policy && amount > policy.coverageRwf) {
      setError("claimedAmountRwf", { message: `Claim up to ${formatRwf(policy.coverageRwf)}, the policy coverage.` });
      return;
    }
    await run(() => services.incidents.fileClaim(actor, incident.id, { policyId: values.policyId, claimedAmountRwf: amount, notes: values.notes }), {
      success: "Claim submitted. It has not been decided.",
      onError: (_e, fields) => applyFieldErrors(setError, fields),
    });
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <FormField label="Insurance policy" required error={errors.policyId?.message}>
        <select className={controlClass} aria-invalid={Boolean(errors.policyId)} {...register("policyId")}>
          <option value="">Choose a policy</option>
          {policies.map((item) => (
            <option key={item.id} value={item.id}>{item.provider} {item.policyNumber}{expired(item) ? " (expired at incident date)" : ""}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Claimed amount (RWF)" required hint={policy ? `Up to ${formatRwf(policy.coverageRwf)}` : undefined} error={errors.claimedAmountRwf?.message}>
        <input type="number" min={1} max={policy?.coverageRwf} inputMode="numeric" className={controlClass} aria-invalid={Boolean(errors.claimedAmountRwf)} {...register("claimedAmountRwf")} />
      </FormField>
      {policy?.coverageNotes ? <p className="text-sm text-muted sm:col-span-2">Coverage notes: {policy.coverageNotes}</p> : null}
      <FormField label="Notes for the insurer" required error={errors.notes?.message} className="sm:col-span-2">
        <textarea className={`${controlClass} min-h-24`} aria-invalid={Boolean(errors.notes)} {...register("notes")} />
      </FormField>
      <div className="sm:col-span-2">
        <PrimaryButton type="submit" disabled={busy}>{busy ? "Submitting…" : "File insurance claim"}</PrimaryButton>
      </div>
    </form>
  );
}
