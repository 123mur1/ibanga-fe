"use client";

import { useState } from "react";
import { ConfirmButton } from "@/components/common/confirm-button";
import { controlClass, FilePicker, FormField } from "@/components/common/form-fields";
import { DetailList } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { effectiveDocumentStatus, expiryState } from "@/config/business-rules";
import { GhostButton, Modal, PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { formatDate, formatDateTime } from "@/lib/format";
import { applyFieldErrors, useZodForm, type PickedFile } from "@/lib/forms";
import { services } from "@/services";
import type { OpsDocument } from "@/types/ops";
import { DOCUMENT_TYPE_LABELS, renewSchema } from "./schemas";

function PreviewDialog({ doc, onClose }: { doc: OpsDocument; onClose: () => void }) {
  const isImage = doc.mimeType.startsWith("image/");
  const isPdf = doc.mimeType === "application/pdf";
  return (
    <Modal title={doc.title} description={`${doc.ref} · version ${doc.version}`} onClose={onClose} wide footer={<GhostButton type="button" onClick={onClose}>Close</GhostButton>}>
      <div className="space-y-4">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={doc.fileUrl} alt={`Preview of ${doc.fileName}`} className="max-h-96 w-full rounded-lg border border-line object-contain" />
        ) : isPdf ? (
          <iframe src={doc.fileUrl} title={`Preview of ${doc.fileName}`} className="h-96 w-full rounded-lg border border-line" />
        ) : (
          <Notice title="No preview available">This file type cannot be previewed here.</Notice>
        )}
        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="inline-block text-sm font-semibold text-brand hover:text-brand-dark">
          Open {doc.fileName} in a new tab
        </a>
        <DetailList
          items={[
            { label: "Type", value: DOCUMENT_TYPE_LABELS[doc.type] },
            { label: "Status", value: <StatusBadge family="verification" status={effectiveDocumentStatus(doc)} /> },
            { label: "Issued", value: formatDate(doc.issueDate) },
            { label: "Expires", value: formatDate(doc.expiryDate) },
            { label: "Submitted", value: formatDateTime(doc.submittedAt) },
            { label: "Reviewed", value: doc.reviewedAt ? formatDateTime(doc.reviewedAt) : "Not reviewed yet" },
          ]}
        />
        {doc.rejectionReason ? <Notice tone="danger" title="Rejection reason">{doc.rejectionReason}</Notice> : null}
      </div>
    </Modal>
  );
}

function RenewDialog({ doc, rejected, onClose }: { doc: OpsDocument; rejected: boolean; onClose: () => void }) {
  const actor = useActor();
  const { run, busy } = useAction();
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [fileError, setFileError] = useState<string>();
  const { register, handleSubmit, setError, formState: { errors } } = useZodForm(renewSchema, {
    defaultValues: { issueDate: rejected ? (doc.issueDate ?? "") : "", expiryDate: rejected ? (doc.expiryDate ?? "") : "" },
  });

  const submit = handleSubmit(async (values) => {
    const file = files[0];
    if (!actor) return;
    if (!file) {
      setFileError("Choose the new file.");
      return;
    }
    const done = await run(
      () =>
        services.documents.resubmit(actor, doc.id, {
          fileName: file.name,
          fileUrl: file.url,
          mimeType: file.mimeType,
          issueDate: values.issueDate || undefined,
          expiryDate: values.expiryDate || undefined,
        }),
      { success: "Document resubmitted for review.", onError: (_error, fields) => applyFieldErrors(setError, fields) },
    );
    if (done) onClose();
  });

  return (
    <Modal
      title={rejected ? "Resubmit document" : "Renew document"}
      description={`${doc.title} · becomes version ${doc.version + 1} and goes back to review`}
      onClose={() => !busy && onClose()}
      footer={
        <>
          <GhostButton type="button" disabled={busy} onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton type="button" disabled={busy} onClick={() => void submit()}>{busy ? "Sending…" : "Submit for review"}</PrimaryButton>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {doc.rejectionReason ? <Notice tone="danger" title="Why it was rejected">{doc.rejectionReason}</Notice> : null}
        <FilePicker label="Replacement file" files={files} onChange={(next) => { setFiles(next); setFileError(undefined); }} error={fileError} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Issue date" error={errors.issueDate?.message}><input type="date" className={controlClass} {...register("issueDate")} /></FormField>
          <FormField label="Expiry date" error={errors.expiryDate?.message}><input type="date" className={controlClass} {...register("expiryDate")} /></FormField>
        </div>
        <button type="submit" className="sr-only" tabIndex={-1}>Submit</button>
      </form>
    </Modal>
  );
}

export function DocumentRow({ doc, warningDays }: { doc: OpsDocument; warningDays: number }) {
  const actor = useActor();
  const { run } = useAction();
  const [dialog, setDialog] = useState<"preview" | "renew" | null>(null);
  const status = effectiveDocumentStatus(doc);
  const expiry = expiryState(doc.expiryDate, warningDays);
  const canResubmit = doc.status !== "PENDING" && (doc.status === "REJECTED" || expiry === "EXPIRED" || expiry === "EXPIRING");
  const rejected = doc.status === "REJECTED";

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-navy">{doc.title}</p>
          <p className="text-xs text-muted">
            {DOCUMENT_TYPE_LABELS[doc.type]} · {doc.ref} · version {doc.version} · {doc.fileName}
          </p>
          <p className="mt-1 text-xs text-muted">
            Issued {formatDate(doc.issueDate)} · Expires {formatDate(doc.expiryDate)} · Submitted {formatDate(doc.submittedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge family="verification" status={status} />
          {expiry !== "NO_EXPIRY" && expiry !== "VALID" ? <StatusBadge family="documentExpiry" status={expiry} /> : null}
        </div>
      </div>
      {doc.status === "REJECTED" && doc.rejectionReason ? (
        <div className="mt-3"><Notice tone="danger" title="Rejected">{doc.rejectionReason}</Notice></div>
      ) : null}
      {status === "EXPIRED" && doc.status !== "REJECTED" ? (
        <div className="mt-3"><Notice tone="danger" title="This document has expired">Anything that depends on it cannot take new work until a renewed version is approved.</Notice></div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <GhostButton type="button" onClick={() => setDialog("preview")}>Preview</GhostButton>
        {canResubmit ? <GhostButton type="button" onClick={() => setDialog("renew")}>{rejected ? "Resubmit" : "Renew"}</GhostButton> : null}
        <span title={doc.status === "APPROVED" ? "Approved documents cannot be deleted. Upload a replacement instead." : undefined}>
          <ConfirmButton
            variant="ghost"
            tone="danger"
            label="Delete"
            title={`Delete ${doc.title}?`}
            message="This removes the document from your account."
            summary={["The file is deleted from this browser.", "Anything that relied on it may become ineligible."]}
            disabled={doc.status === "APPROVED"}
            onConfirm={() => run(() => services.documents.remove(actor!, doc.id), { success: "Document deleted." })}
          />
        </span>
      </div>
      {dialog === "preview" ? <PreviewDialog doc={doc} onClose={() => setDialog(null)} /> : null}
      {dialog === "renew" ? <RenewDialog doc={doc} rejected={rejected} onClose={() => setDialog(null)} /> : null}
    </li>
  );
}
