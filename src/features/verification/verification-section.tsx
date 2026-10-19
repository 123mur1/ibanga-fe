"use client";

import Link from "next/link";
import { QueryBoundary } from "@/components/common/async-state";
import { Notice, SimulationNotice } from "@/components/common/notices";
import { Section } from "@/components/common/layout-blocks";
import { StatusBadge } from "@/components/common/status-badge";
import { effectiveDocumentStatus } from "@/config/business-rules";
import { PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { Actor } from "@/services/types";
import type { OpsDocument, VerificationKind, VerificationRequest, VerificationStatus } from "@/types/ops";
import { DOCUMENT_TYPE_LABELS } from "@/features/documents/schemas";
import { portalBase, type PortalRole } from "@/features/support/portal";
import { CompanyProfileForm } from "./company-profile-form";

const KINDS: { kind: Extract<VerificationKind, "IDENTITY" | "COMPANY">; title: string; docType: "IDENTITY" | "COMPANY_REGISTRATION"; help: string }[] = [
  { kind: "IDENTITY", title: "Identity verification", docType: "IDENTITY", help: "A national ID or passport for the account holder." },
  { kind: "COMPANY", title: "Company verification", docType: "COMPANY_REGISTRATION", help: "Your company registration certificate." },
];

function statusFor(latest: VerificationRequest | undefined, docs: OpsDocument[]): VerificationStatus {
  if (!latest) return "NOT_SUBMITTED";
  if (latest.status !== "APPROVED") return latest.status;
  // Approved, but a document it relied on has since expired.
  const used = docs.filter((doc) => latest.documentIds.includes(doc.id));
  return used.some((doc) => effectiveDocumentStatus(doc) === "EXPIRED") ? "EXPIRED" : "APPROVED";
}

function KindCard({ item, actor, requests, docs, documentsHref }: { item: (typeof KINDS)[number]; actor: Actor; requests: VerificationRequest[]; docs: OpsDocument[]; documentsHref: string }) {
  const { run, busy } = useAction();
  const mine = requests.filter((request) => request.kind === item.kind && request.subjectKind === "USER" && request.subjectId === actor.id);
  const latest = mine[0]; // listVerifications returns newest first
  const kindDocs = docs.filter((doc) => doc.type === item.docType && doc.subjectKind === "USER");
  const status = statusFor(latest, docs);
  const submittable = kindDocs.filter((doc) => doc.status !== "REJECTED");

  return (
    <li className="rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-navy">{item.title}</h3>
          <p className="text-xs text-muted">{item.help}</p>
        </div>
        <StatusBadge family="verification" status={status} />
      </div>
      {latest ? <p className="mt-2 text-xs text-muted">Request {latest.ref} · submitted {formatDate(latest.submittedAt)}{latest.reviewedAt ? ` · reviewed ${formatDate(latest.reviewedAt)}` : ""}</p> : null}
      {status === "REJECTED" ? (
        <div className="mt-3"><Notice tone="danger" title="Rejected">{latest?.rejectionReason ?? "The documents could not be accepted."} Resubmit the document with a corrected file to start a new review.</Notice></div>
      ) : null}
      {status === "EXPIRED" ? (
        <div className="mt-3"><Notice tone="danger" title="Verification expired">A document used for this verification has expired. Renew it to be verified again.</Notice></div>
      ) : null}
      {status === "PENDING" ? <p className="mt-3 text-sm text-muted">An administrator is reviewing your documents. This is a demonstration review, not a real check.</p> : null}
      {kindDocs.length ? (
        <ul className="mt-3 space-y-1 text-sm">
          {kindDocs.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-navy">{doc.title} <span className="text-xs text-muted">({DOCUMENT_TYPE_LABELS[doc.type]})</span></span>
              <StatusBadge family="verification" status={effectiveDocumentStatus(doc)} />
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        {status === "NOT_SUBMITTED" && submittable.length ? (
          <PrimaryButton
            type="button"
            disabled={busy}
            onClick={() =>
              void run(
                () => services.documents.submitVerification(actor, { kind: item.kind, subjectKind: "USER", subjectId: actor.id, documentIds: submittable.map((doc) => doc.id) }),
                { success: "Submitted for verification." },
              )
            }
          >
            {busy ? "Submitting…" : "Submit for verification"}
          </PrimaryButton>
        ) : null}
        {status === "NOT_SUBMITTED" || status === "REJECTED" || status === "EXPIRED" ? (
          <Link href={documentsHref} className="inline-flex items-center rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-brand hover:text-brand">
            {kindDocs.length ? (status === "NOT_SUBMITTED" ? "Manage documents" : "Resubmit document") : "Upload document"}
          </Link>
        ) : null}
      </div>
    </li>
  );
}

function overall(statuses: VerificationStatus[]): VerificationStatus {
  if (statuses.every((status) => status === "APPROVED")) return "APPROVED";
  for (const wanted of ["REJECTED", "EXPIRED", "PENDING"] as const) if (statuses.includes(wanted)) return wanted;
  return "NOT_SUBMITTED";
}

function OverallBadge({ value }: { value: VerificationStatus }) {
  return <StatusBadge family="verification" status={value} label={value === "APPROVED" ? "Verified account" : undefined} />;
}

/** Identity and company verification, account status and company profile for importer/owner profile pages. */
export function VerificationSection({ role }: { role: PortalRole }) {
  const actor = useActor();
  const { currentUser } = useIbanga();
  const requests = useServiceQuery(() => services.documents.listVerifications(actor!, { pageSize: 100 }), [actor?.id]);
  const documents = useServiceQuery(() => services.documents.list(actor!, { pageSize: 200 }), [actor?.id]);
  const documentsHref = `${portalBase(role)}/documents`;

  return (
    <div className="mt-8 max-w-3xl space-y-5">
      <SimulationNotice kind="verification" />
      <Section
        title="Verification"
        description="Verified accounts are trusted by the other side of a booking."
        actions={
          requests.data && documents.data && actor ? (
            <OverallBadge value={overall(KINDS.map((item) => statusFor(requests.data!.items.find((request) => request.kind === item.kind && request.subjectId === actor.id), documents.data!.items)))} />
          ) : null
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
          Account status:
          {currentUser ? <StatusBadge family="account" status={currentUser.active ? "ACTIVE" : "INACTIVE"} /> : null}
        </div>
        <QueryBoundary query={requests}>
          {(requestPage) => (
            <QueryBoundary query={documents}>
              {(documentPage) => (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {KINDS.map((item) => (
                    <KindCard key={item.kind} item={item} actor={actor!} requests={requestPage.items} docs={documentPage.items} documentsHref={documentsHref} />
                  ))}
                </ul>
              )}
            </QueryBoundary>
          )}
        </QueryBoundary>
      </Section>
      <CompanyProfileForm />
    </div>
  );
}
