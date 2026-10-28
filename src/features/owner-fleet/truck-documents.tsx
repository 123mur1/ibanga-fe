"use client";

import { useRef, useState } from "react";
import { controlClass, FilePicker, FormField } from "@/components/common/form-fields";
import { Notice } from "@/components/common/notices";
import { Section } from "@/components/common/layout-blocks";
import { StatusBadge } from "@/components/common/status-badge";
import { PrimaryButton } from "@/components/ui";
import { daysUntil, effectiveDocumentStatus, expiryState } from "@/config/business-rules";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { applyFieldErrors, useZodForm, type PickedFile } from "@/lib/forms";
import { formatDate } from "@/lib/format";
import type { OpsDocument } from "@/types/ops";
import { uploadOrResubmit } from "./document-upload";
import { TRUCK_DOCUMENT_TYPES, truckDocumentSchema } from "./schemas";

type TruckDocumentType = (typeof TRUCK_DOCUMENT_TYPES)[number]["value"];

/**
 * The truck's required documents as a checklist. Each row shows where that document stands and
 * opens the upload form for it; an administrator reviews every submission.
 */
export function TruckDocuments({ truckId, plateNumber }: { truckId: string; plateNumber: string }) {
  const actor = useActor();
  const ops = useOps();
  const { run, busy } = useAction();
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [fileError, setFileError] = useState<string>();
  const [formOpen, setFormOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const documents = ops.documents.filter((doc) => doc.subjectKind === "TRUCK" && doc.subjectId === truckId);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors },
  } = useZodForm(truckDocumentSchema, { defaultValues: { type: "VEHICLE_REGISTRATION", issueDate: "", expiryDate: "" } });

  const rows = TRUCK_DOCUMENT_TYPES.map(({ value, label }) => ({ value, label, doc: documents.find((item) => item.type === value) }));
  const approved = rows.filter((row) => row.doc && effectiveDocumentStatus(row.doc) === "APPROVED").length;
  const missing = rows.filter((row) => !row.doc).length;
  const pending = rows.filter((row) => row.doc?.status === "PENDING").length;

  function openForm(type: TruckDocumentType) {
    setValue("type", type);
    setFormOpen(true);
    // Wait for the form to render before scrolling to it.
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  const submit = handleSubmit(async (values) => {
    const file = files[0];
    if (!file) {
      setFileError("Choose the document file.");
      return;
    }
    if (!actor) return;
    const label = TRUCK_DOCUMENT_TYPES.find((item) => item.value === values.type)?.label ?? "Document";
    const saved = await run(
      () =>
        uploadOrResubmit(
          actor,
          {
            type: values.type,
            subjectKind: "TRUCK",
            subjectId: truckId,
            title: `${label} ${plateNumber}`,
            fileName: file.name,
            fileUrl: file.url,
            mimeType: file.mimeType,
            issueDate: values.issueDate || undefined,
            expiryDate: values.expiryDate,
          },
          ops.documents,
        ),
      { success: `${label} sent to the administrator for review.`, onError: (_error, fields) => applyFieldErrors(setError, fields) },
    );
    if (saved) {
      setFiles([]);
      setFormOpen(false);
      reset({ type: values.type, issueDate: "", expiryDate: "" });
    }
  });

  return (
    <Section
      title="Truck documents"
      description={`${approved} of ${rows.length} approved. Registration, inspection and insurance must be approved and in date for the truck to quote or take work.`}
    >
      <div className="space-y-4">
        {missing ? (
          <Notice tone="warning" title={`${missing} document${missing === 1 ? "" : "s"} still to submit`}>
            Upload each one below. An administrator reviews it and you are notified of the decision.
          </Notice>
        ) : pending ? (
          <Notice tone="info" title="Waiting for the administrator">
            {pending} document{pending === 1 ? " is" : "s are"} being reviewed.
          </Notice>
        ) : null}

        <ul className="divide-y divide-line rounded-xl border border-line">
          {rows.map((row) => (
            <ChecklistRow key={row.value} label={row.label} doc={row.doc} disabled={busy || !actor} onUpload={() => openForm(row.value)} />
          ))}
        </ul>

        {formOpen ? (
          <form ref={formRef} onSubmit={submit} noValidate className="space-y-4 rounded-xl border border-line bg-background/50 p-4">
            <h3 className="font-semibold text-navy">Submit a document</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Document type" required error={errors.type?.message}>
                <select className={controlClass} {...register("type")}>
                  {TRUCK_DOCUMENT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </FormField>
              <FormField label="Issue date" error={errors.issueDate?.message}>
                <input className={controlClass} type="date" {...register("issueDate")} />
              </FormField>
              <FormField label="Expiry date" required error={errors.expiryDate?.message}>
                <input className={controlClass} type="date" aria-invalid={Boolean(errors.expiryDate)} {...register("expiryDate")} />
              </FormField>
            </div>
            <FilePicker
              label="Document file"
              files={files}
              onChange={(next) => {
                setFiles(next);
                setFileError(undefined);
              }}
              error={fileError}
            />
            <p className="text-xs text-muted">The document stays pending until an administrator approves it. Submitting again replaces the earlier document of the same type.</p>
            <div className="flex flex-wrap items-center gap-3">
              <PrimaryButton type="submit" disabled={busy || !actor}>{busy ? "Uploading…" : "Submit for review"}</PrimaryButton>
              <button type="button" disabled={busy} onClick={() => setFormOpen(false)} className="text-sm font-semibold text-muted hover:text-navy">
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </Section>
  );
}

function ChecklistRow({ label, doc, disabled, onUpload }: { label: string; doc?: OpsDocument; disabled: boolean; onUpload: () => void }) {
  const status = doc ? effectiveDocumentStatus(doc) : "NOT_SUBMITTED";
  const state = doc ? expiryState(doc.expiryDate) : "NO_EXPIRY";
  const days = doc?.expiryDate ? daysUntil(doc.expiryDate) : undefined;
  // A pending document is with the administrator and cannot be replaced until it is decided.
  const action = !doc ? "Upload" : status === "PENDING" ? null : status === "REJECTED" || status === "EXPIRED" ? "Fix" : "Replace";
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="font-semibold text-navy">{label}</p>
        {doc ? (
          <p className="text-xs text-muted">
            {doc.fileName} · submitted {formatDate(doc.submittedAt)}
            {doc.version > 1 ? ` · version ${doc.version}` : ""}
          </p>
        ) : (
          <p className="text-xs text-muted">Not submitted yet.</p>
        )}
        {doc?.expiryDate ? (
          <p className={`mt-0.5 text-xs ${state === "EXPIRED" ? "font-semibold text-bad" : state === "EXPIRING" ? "font-semibold text-warn" : "text-muted"}`}>
            {state === "EXPIRED" ? `Expired on ${formatDate(doc.expiryDate)}` : `Expires ${formatDate(doc.expiryDate)}${days !== undefined ? ` (${days} day${days === 1 ? "" : "s"} left)` : ""}`}
          </p>
        ) : null}
        {doc?.status === "REJECTED" && doc.rejectionReason ? <p className="mt-0.5 text-xs text-bad">Rejected: {doc.rejectionReason}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge family="verification" status={status} />
        {action ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onUpload}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-60 ${action === "Replace" ? "border border-line text-navy hover:bg-background" : "bg-brand text-white hover:bg-brand-dark"}`}
          >
            {action}
          </button>
        ) : (
          <span className="text-xs text-muted">With administrator</span>
        )}
      </div>
    </li>
  );
}
