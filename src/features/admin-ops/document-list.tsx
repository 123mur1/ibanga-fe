"use client";

import { useState } from "react";
import { ConfirmButton } from "@/components/common/confirm-button";
import { controlClass } from "@/components/common/form-fields";
import { StatusBadge } from "@/components/common/status-badge";
import { daysUntil, effectiveDocumentStatus, expiryState } from "@/config/business-rules";
import { useDocumentFile } from "@/features/documents/use-document-file";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { formatDate, formatDateTime, titleCase } from "@/lib/format";
import { services } from "@/services";
import type { OpsDocument } from "@/types/ops";

/** Expiry badge text such as "Expires in 12 days" or "Expired 3 days ago". */
export function ExpiryBadge({ expiryDate }: { expiryDate?: string }) {
  const { settings } = useOps();
  const state = expiryState(expiryDate, settings.documentWarningDays);
  if (state === "NO_EXPIRY" || !expiryDate) return <StatusBadge family="documentExpiry" status="NO_EXPIRY" />;
  const days = daysUntil(expiryDate);
  const label = state === "EXPIRED" ? `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago` : state === "EXPIRING" ? `Expires in ${days} day${days === 1 ? "" : "s"}` : "Valid";
  return <StatusBadge family="documentExpiry" status={state} label={label} />;
}

/**
 * Submitted documents with a preview (image inline, other files as a link). With `reviewable`,
 * pending documents get approve and reject controls so the administrator can decide each one.
 */
export function DocumentList({ documents, highlightIds = [], reviewable = false }: { documents: OpsDocument[]; highlightIds?: string[]; reviewable?: boolean }) {
  if (!documents.length) return <p className="text-sm text-muted">No documents on file.</p>;
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} highlighted={highlightIds.includes(doc.id)} reviewable={reviewable} />
      ))}
    </ul>
  );
}

function DocumentCard({ doc, highlighted, reviewable }: { doc: OpsDocument; highlighted: boolean; reviewable: boolean }) {
  const file = useDocumentFile(doc);
  const isImage = doc.mimeType.startsWith("image/") || file.url.startsWith("data:image/");
  const isPdf = doc.mimeType === "application/pdf" || file.url.startsWith("data:application/pdf");
  return (
    <li className={`overflow-hidden rounded-xl border bg-white ${highlighted ? "border-brand" : "border-line"}`}>
      {file.loading ? (
        <div className="flex h-36 items-center justify-center bg-background text-sm text-muted">Loading file…</div>
      ) : file.url && isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={file.url} alt={`Preview of ${doc.title}`} className="h-36 w-full bg-background object-contain" />
      ) : (
        <div className="flex h-36 items-center justify-center bg-brand-soft/50 text-sm font-semibold text-brand-dark">
          {file.failed ? "Could not load the file" : file.url ? (isPdf ? "PDF document" : "Preview not available here") : "No file attached"}
        </div>
      )}
      <div className="space-y-2 p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-navy">{doc.title}</p>
          <StatusBadge family="verification" status={effectiveDocumentStatus(doc)} />
        </div>
        <p className="text-muted">
          {titleCase(doc.type)} · {doc.ref} · v{doc.version}
        </p>
        <p className="text-muted">
          Issued {formatDate(doc.issueDate)} · Expires {formatDate(doc.expiryDate)}
        </p>
        <p className="text-muted">Submitted {formatDateTime(doc.submittedAt)}</p>
        <ExpiryBadge expiryDate={doc.expiryDate} />
        {doc.rejectionReason ? <p className="text-bad">Rejected: {doc.rejectionReason}</p> : null}
        {file.url ? (
          <a href={file.url} target="_blank" rel="noreferrer" download={doc.fileName} className="block font-semibold text-brand hover:text-brand-dark">
            Open {doc.fileName}
          </a>
        ) : null}
        {reviewable && doc.status === "PENDING" ? <DocumentDecision doc={doc} /> : null}
      </div>
    </li>
  );
}

/** Approve or reject one document. Rejecting needs a reason the owner will see. */
function DocumentDecision({ doc }: { doc: OpsDocument }) {
  const actor = useActor();
  const { run, busy } = useAction();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const validReason = reason.trim().length >= 5;

  if (!actor) return null;
  return (
    <div className="space-y-3 border-t border-line pt-3">
      {rejecting ? (
        <label className="block">
          <span className="text-xs font-semibold text-navy">Reason for rejection (shown to the owner)</span>
          <textarea rows={2} value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} className={`${controlClass} mt-1`} />
        </label>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {rejecting ? (
          <>
            <ConfirmButton
              label="Confirm rejection"
              title={`Reject ${doc.title}?`}
              message="The owner sees your reason and must upload a corrected document."
              tone="danger"
              disabled={busy || !validReason}
              onConfirm={() => run(() => services.documents.review(actor, doc.id, { approve: false, reason: reason.trim() }), { success: "Document rejected." })}
            />
            <button type="button" disabled={busy} onClick={() => setRejecting(false)} className="px-2 text-sm font-semibold text-muted hover:text-navy">
              Cancel
            </button>
          </>
        ) : (
          <>
            <ConfirmButton
              label="Approve"
              title={`Approve ${doc.title}?`}
              message="The document is marked approved and the owner is notified."
              summary={["The truck's verification is recalculated from its documents"]}
              disabled={busy}
              onConfirm={() => run(() => services.documents.review(actor, doc.id, { approve: true }), { success: "Document approved." })}
            />
            <button type="button" disabled={busy} onClick={() => setRejecting(true)} className="rounded-lg border border-bad/30 px-3 py-2 text-sm font-semibold text-bad hover:bg-bad-soft">
              Reject
            </button>
          </>
        )}
      </div>
      {rejecting && !validReason ? <p className="text-xs text-muted">Write at least 5 characters to reject.</p> : null}
    </div>
  );
}
