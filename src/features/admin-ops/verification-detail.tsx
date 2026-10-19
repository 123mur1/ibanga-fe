"use client";

import { QueryBoundary } from "@/components/common/async-state";
import { DetailList, Section } from "@/components/common/layout-blocks";
import { Notice, SimulationNotice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { driverEligibility, truckEligibility, type Eligibility } from "@/config/business-rules";
import { useActor } from "@/hooks/use-actor";
import { useAction } from "@/hooks/use-action";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDateTime, titleCase } from "@/lib/format";
import { services } from "@/services";
import { ServiceError } from "@/services/types";
import type { OpsDocument, VerificationRequest } from "@/types/ops";
import { DocumentList } from "./document-list";
import { EligibilityNotice } from "./eligibility-card";
import { ReasonReview } from "./reason-review";
import { TextLink, useAdminLookups } from "./use-admin";

/** What approving would change for the applicant, using the same eligibility rules as quoting and assignment. */
function useApprovalEffect(request: VerificationRequest, documents: OpsDocument[]) {
  const ops = useOps();
  const afterDocs = documents.map((doc) => (request.documentIds.includes(doc.id) && doc.status === "PENDING" ? { ...doc, status: "APPROVED" as const } : doc));
  if (request.subjectKind === "TRUCK") {
    const profile = ops.truckProfiles.find((item) => item.truckId === request.subjectId);
    return {
      before: truckEligibility(profile, documents),
      after: profile ? truckEligibility({ ...profile, verification: "APPROVED" }, afterDocs) : undefined,
      noun: "This truck",
      verb: "quote on cargo requests",
    };
  }
  if (request.subjectKind === "DRIVER") {
    const driver = ops.drivers.find((item) => item.id === request.subjectId);
    return {
      before: driver ? driverEligibility(driver, documents) : undefined,
      after: driver ? driverEligibility({ ...driver, verification: "APPROVED" }, afterDocs) : undefined,
      noun: "This driver",
      verb: "be assigned to trips",
    };
  }
  return { before: undefined, after: undefined, noun: "This account", verb: "" };
}

function Effect({ request, documents }: { request: VerificationRequest; documents: OpsDocument[] }) {
  const effect = useApprovalEffect(request, documents);
  if (request.subjectKind === "USER") {
    return <Notice tone="info" title="Effect of approval">Approving marks the account identity or company as verified. Rejecting leaves it unverified and the user must resubmit.</Notice>;
  }
  const after: Eligibility | undefined = effect.after;
  return (
    <div className="space-y-3">
      {request.status === "PENDING" && after ? (
        after.eligible ? (
          <Notice tone="success" title={`If approved: ${effect.noun.toLowerCase()} becomes eligible to ${effect.verb}`}>
            Rejecting keeps it ineligible until corrected documents are approved.
          </Notice>
        ) : (
          <Notice tone="warning" title={`If approved: ${effect.noun.toLowerCase()} still cannot ${effect.verb}`}>
            <ul className="list-disc pl-5">{after.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          </Notice>
        )
      ) : null}
      {effect.before ? <EligibilityNotice subject={`${effect.noun} right now`} result={effect.before} /> : null}
    </div>
  );
}

export function VerificationDetail({ id }: { id: string }) {
  const actor = useActor();
  const ops = useOps();
  const { run, busy } = useAction();
  const { subject, userName } = useAdminLookups();
  const query = useServiceQuery(async () => {
    const page = await services.documents.listVerifications(actor!, { pageSize: 500 });
    const found = page.items.find((item) => item.id === id);
    if (!found) throw new ServiceError("NOT_FOUND", "This verification request does not exist.");
    return found;
  }, [actor?.id, id]);

  return (
    <div className="mt-6">
      <QueryBoundary query={query}>
        {(request) => {
          const who = subject(request.subjectKind, request.subjectId);
          const requestDocs = ops.documents.filter((doc) => request.documentIds.includes(doc.id));
          const subjectDocs = ops.documents.filter((doc) => doc.subjectKind === request.subjectKind && doc.subjectId === request.subjectId);
          const previous = ops.verificationRequests
            .filter((item) => item.id !== request.id && item.subjectKind === request.subjectKind && item.subjectId === request.subjectId && item.status !== "PENDING")
            .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
          const pending = request.status === "PENDING";
          return (
            <div className="space-y-5">
              <SimulationNotice kind="verification" />
              <Section title="Applicant" actions={<StatusBadge family="verification" status={request.status} />}>
                <DetailList
                  items={[
                    { label: "Request", value: `${request.ref} · ${titleCase(request.kind)}` },
                    { label: titleCase(request.subjectKind), value: request.subjectKind === "USER" ? who.label : <TextLink href={who.href}>{who.label}</TextLink> },
                    { label: "Requested by", value: userName(request.requesterId) },
                    { label: "Submitted", value: formatDateTime(request.submittedAt) },
                    { label: "Applicant note", value: request.note || "—", wide: true },
                    ...(request.reviewedAt ? [{ label: "Reviewed", value: `${formatDateTime(request.reviewedAt)} by ${userName(request.reviewedBy)}` }] : []),
                    ...(request.rejectionReason ? [{ label: "Rejection reason", value: request.rejectionReason, wide: true }] : []),
                  ]}
                />
              </Section>

              <Section title="Submitted documents" description={`${requestDocs.length} document${requestDocs.length === 1 ? "" : "s"} in this request`}>
                <DocumentList documents={requestDocs} />
              </Section>

              {subjectDocs.length > requestDocs.length ? (
                <Section title="Other documents on file" description="Used to work out eligibility.">
                  <DocumentList documents={subjectDocs.filter((doc) => !request.documentIds.includes(doc.id))} />
                </Section>
              ) : null}

              <Section title="Previous review">
                {previous ? (
                  <p className="text-sm text-navy">
                    {previous.ref} was <StatusBadge family="verification" status={previous.status} /> {formatDateTime(previous.reviewedAt)}
                    {previous.rejectionReason ? `: ${previous.rejectionReason}` : "."}
                  </p>
                ) : (
                  <p className="text-sm text-muted">No earlier review for this applicant.</p>
                )}
              </Section>

              <Section title="Effect on eligibility">
                <Effect request={request} documents={subjectDocs} />
              </Section>

              <Section title="Decision">
                {pending ? (
                  <ReasonReview
                    disabled={busy}
                    approve={{
                      label: "Approve",
                      title: `Approve ${request.ref}?`,
                      message: "The submitted documents will be marked approved.",
                      summary: ["Documents in this request become approved", "Eligibility is recalculated immediately", "The applicant is notified", "Demonstration only, no real checks were made"],
                    }}
                    reject={{
                      label: "Reject",
                      title: `Reject ${request.ref}?`,
                      message: "The applicant will see your reason and must resubmit.",
                      summary: ["Documents are marked rejected", "The subject stays ineligible"],
                    }}
                    onApprove={() => run(() => services.documents.reviewVerification(actor!, request.id, { approve: true }), { success: "Verification approved." })}
                    onReject={(reason) => run(() => services.documents.reviewVerification(actor!, request.id, { approve: false, reason }), { success: "Verification rejected." })}
                  />
                ) : (
                  <Notice tone="info" title="Already reviewed">This request was decided and cannot be changed. The applicant can submit a new request.</Notice>
                )}
              </Section>
            </div>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
