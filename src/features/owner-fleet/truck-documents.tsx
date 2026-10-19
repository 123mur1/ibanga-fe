"use client";

import { useState } from "react";
import { controlClass, FilePicker, FormField } from "@/components/common/form-fields";
import { Notice } from "@/components/common/notices";
import { Section } from "@/components/common/layout-blocks";
import { PrimaryButton } from "@/components/ui";
import { effectiveDocumentStatus, expiryState } from "@/config/business-rules";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { applyFieldErrors, useZodForm, type PickedFile } from "@/lib/forms";
import { formatDate } from "@/lib/format";
import { DocumentList } from "./document-list";
import { uploadOrResubmit } from "./document-upload";
import { TRUCK_DOCUMENT_TYPES, truckDocumentSchema } from "./schemas";

/** Registration, inspection and insurance documents for one truck, with expiry reminders and upload. */
export function TruckDocuments({ truckId, plateNumber }: { truckId: string; plateNumber: string }) {
  const actor = useActor();
  const ops = useOps();
  const { run, busy } = useAction();
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [fileError, setFileError] = useState<string>();
  const documents = ops.documents.filter((doc) => doc.subjectKind === "TRUCK" && doc.subjectId === truckId);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useZodForm(truckDocumentSchema, { defaultValues: { type: "VEHICLE_REGISTRATION", issueDate: "", expiryDate: "" } });

  const reminders: { key: string; tone: "danger" | "warning"; text: string }[] = [];
  for (const { value, label } of TRUCK_DOCUMENT_TYPES) {
    const doc = documents.find((item) => item.type === value);
    if (!doc) reminders.push({ key: value, tone: "danger", text: `${label} is missing.` });
    else if (effectiveDocumentStatus(doc) === "EXPIRED") reminders.push({ key: value, tone: "danger", text: `${label} expired on ${formatDate(doc.expiryDate)}.` });
    else if (expiryState(doc.expiryDate, ops.settings.documentWarningDays) === "EXPIRING") reminders.push({ key: value, tone: "warning", text: `${label} expires on ${formatDate(doc.expiryDate)}.` });
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
      { success: `${label} submitted for review.`, onError: (_error, fields) => applyFieldErrors(setError, fields) },
    );
    if (saved) {
      setFiles([]);
      reset({ type: values.type, issueDate: "", expiryDate: "" });
    }
  });

  return (
    <Section title="Documents" description="Registration, inspection and insurance must be approved and in date for the truck to quote or take work.">
      <div className="space-y-4">
        {reminders.length ? (
          <div className="space-y-2">
            {reminders.map((item) => <Notice key={item.key} tone={item.tone}>{item.text}</Notice>)}
          </div>
        ) : (
          <Notice tone="success">All required documents are present and not near expiry.</Notice>
        )}
        <DocumentList documents={documents} empty="No documents uploaded for this truck yet." />

        <form onSubmit={submit} noValidate className="space-y-4 rounded-xl border border-line bg-background/50 p-4">
          <h3 className="font-semibold text-navy">Upload or renew a document</h3>
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
          <p className="text-xs text-muted">A submitted document is pending until an administrator approves it. Uploading again replaces the earlier document of the same type.</p>
          <PrimaryButton type="submit" disabled={busy || !actor}>{busy ? "Uploading…" : "Submit document"}</PrimaryButton>
        </form>
      </div>
    </Section>
  );
}
