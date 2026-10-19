"use client";

import Link from "next/link";
import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { ConfirmButton } from "@/components/common/confirm-button";
import { controlClass } from "@/components/common/form-fields";
import { SimulationNotice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, PageHeader, StatCard } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate, formatRwf } from "@/lib/format";
import { services } from "@/services";
import type { ClaimStatus, InsuranceClaim } from "@/types/ops";
import { claimNoteSchema } from "./schemas";

type Decision = Extract<ClaimStatus, "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PAID_SIMULATED">;

export function ClaimsList() {
  const actor = useActor();
  const query = useServiceQuery(() => services.incidents.listClaims(actor!, { pageSize: 500 }), [actor?.id]);
  const { incidents } = useOps();

  return (
    <>
      <PageHeader
        eyebrow="Incidents and insurance"
        title="Insurance claims"
        subtitle="Claims filed by truck owners against their policies. Decisions here are simulated: no insurer is contacted and no money moves."
      />
      <div className="mt-6"><SimulationNotice kind="general" /></div>
      <div className="mt-5">
        <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0} empty={{ title: "No insurance claims", text: "Claims appear here when a truck owner files one from an incident." }}>
          {(data) => {
            const count = (status: ClaimStatus) => data.items.filter((claim) => claim.status === status).length;
            return (
              <>
                <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Claims" value={data.total} hint="All filed" />
                  <StatCard label="To review" value={count("SUBMITTED") + count("UNDER_REVIEW")} hint="Submitted or under review" accent="warn" />
                  <StatCard label="Approved (simulated)" value={count("APPROVED")} hint="Awaiting simulated payment" accent="good" />
                  <StatCard label="Claimed total" value={formatRwf(data.items.reduce((sum, claim) => sum + claim.claimedAmountRwf, 0))} hint="Demonstration amounts" accent="accent" />
                </div>
                <DataTable
                  columns={[{ label: "Claim" }, { label: "Provider and policy" }, { label: "Coverage" }, { label: "Claimed" }, { label: "Incident" }, { label: "Status" }, { label: "Decision (simulated)" }]}
                  emptyMessage="No claims match your search."
                  exportName="ibanga-insurance-claims"
                  rows={data.items.map((claim) => {
                    const incident = incidents.find((item) => item.id === claim.incidentId);
                    return {
                      id: claim.id,
                      searchText: `${claim.ref} ${claim.provider} ${claim.policyNumber} ${incident?.ref ?? ""} ${claim.status}`,
                      filterValue: claim.status,
                      exportValues: [claim.ref, `${claim.provider} ${claim.policyNumber}`, formatRwf(claim.coverageRwf), formatRwf(claim.claimedAmountRwf), incident?.ref ?? claim.incidentId, claim.status, claim.decisionNote ?? ""],
                      cells: [
                        <span key="c"><strong className="block">{claim.ref}</strong><span className="text-xs text-muted">Filed {formatDate(claim.filedAt)}</span></span>,
                        <span key="p"><strong className="block">{claim.provider}</strong><span className="text-xs text-muted">Policy {claim.policyNumber}</span></span>,
                        formatRwf(claim.coverageRwf),
                        <strong key="a">{formatRwf(claim.claimedAmountRwf)}</strong>,
                        <Link key="i" href={`/dashboard/admin/incidents/${claim.incidentId}`} className="font-semibold text-brand hover:text-brand-dark">{incident?.ref ?? "View incident"}</Link>,
                        <StatusBadge key="s" family="claim" status={claim.status} />,
                        <ClaimActions key="d" claim={claim} />,
                      ],
                    };
                  })}
                />
              </>
            );
          }}
        </QueryBoundary>
      </div>
    </>
  );
}

const FINAL: ClaimStatus[] = ["REJECTED", "PAID_SIMULATED"];

function ClaimActions({ claim }: { claim: InsuranceClaim }) {
  const actor = useActor()!;
  const { run, busy } = useAction();
  const [note, setNote] = useState("");
  const noteOk = claimNoteSchema.safeParse({ note }).success;
  const rejectOk = note.trim().length >= 5;

  if (FINAL.includes(claim.status)) return <span className="text-xs text-muted">{claim.decisionNote ?? "Final decision recorded."}</span>;
  if (claim.status === "DRAFT") return <span className="text-xs text-muted">Draft: not yet submitted by the owner.</span>;

  const decide = (status: Decision, success: string) => run(() => services.incidents.decideClaim(actor, claim.id, status, note.trim()), { success }).then(() => setNote(""));

  return (
    <div className="min-w-64 space-y-2">
      <input className={`${controlClass} !py-1.5 !text-sm`} value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="Decision note (required to reject)" aria-label={`Decision note for ${claim.ref}`} />
      <div className="flex flex-wrap gap-2">
        {claim.status === "SUBMITTED" ? (
          <ConfirmButton variant="ghost" label="Under review" title="Mark under review?" message={`Claim ${claim.ref} will be marked under review (simulated).`} disabled={busy || !noteOk} onConfirm={() => decide("UNDER_REVIEW", "Claim marked under review (simulated).")} />
        ) : null}
        {claim.status !== "APPROVED" ? (
          <ConfirmButton variant="ghost" label="Approve" title="Approve this claim (simulated)?" message={`Approve ${claim.ref} for up to ${formatRwf(claim.claimedAmountRwf)}.`} summary={["Simulation only: no insurer is contacted.", "Approval is not a payment."]} disabled={busy || !noteOk} onConfirm={() => decide("APPROVED", "Claim approved (simulated).")} />
        ) : (
          <ConfirmButton label="Mark paid (simulated)" title="Record a simulated payment?" message={`This marks ${claim.ref} as paid in the demonstration only.`} summary={["No money moves and no insurer is contacted.", "This decision is final."]} disabled={busy || !noteOk} onConfirm={() => decide("PAID_SIMULATED", "Claim marked paid (simulated).")} />
        )}
        <ConfirmButton variant="ghost" tone="danger" label="Reject" title="Reject this claim?" message={`Reject ${claim.ref}. The reason is recorded and the decision is final.`} disabled={busy || !rejectOk} onConfirm={() => decide("REJECTED", "Claim rejected.")} />
      </div>
    </div>
  );
}
