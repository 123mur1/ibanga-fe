"use client";

import { useState } from "react";
import { controlClass, FilePicker, FormField } from "@/components/common/form-fields";
import { Section } from "@/components/common/layout-blocks";
import { PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { applyFieldErrors, useZodForm, type PickedFile } from "@/lib/forms";
import { services } from "@/services";
import { DOCUMENT_TYPE_LABELS, documentSchema, parseSubject, typesFor } from "./schemas";

export type SubjectOption = { value: string; label: string };

export function UploadForm({ subjects }: { subjects: SubjectOption[] }) {
  const actor = useActor();
  const { run, busy } = useAction();
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [fileError, setFileError] = useState<string>();
  const first = subjects[0]?.value ?? "";
  const { register, handleSubmit, reset, setError, setValue, watch, formState: { errors } } = useZodForm(documentSchema, {
    defaultValues: { subject: first, type: typesFor(parseSubject(first).kind)[0], title: "", issueDate: "", expiryDate: "" },
  });
  const subject = watch("subject") || first;
  const kind = parseSubject(subject).kind;

  const submit = handleSubmit(async (values) => {
    if (!actor) return;
    const file = files[0];
    if (!file) {
      setFileError("Choose a file to upload.");
      return;
    }
    const target = parseSubject(values.subject);
    const saved = await run(
      () =>
        services.documents.upload(actor, {
          type: values.type,
          subjectKind: target.kind,
          subjectId: target.id,
          title: values.title,
          fileName: file.name,
          fileUrl: file.url,
          mimeType: file.mimeType,
          issueDate: values.issueDate || undefined,
          expiryDate: values.expiryDate || undefined,
        }),
      {
        success: "Document uploaded and sent for review.",
        onError: (_error, fields) => {
          applyFieldErrors(setError, fields);
          if (fields?.file) setFileError(fields.file);
        },
      },
    );
    if (saved) {
      reset({ subject: values.subject, type: values.type, title: "", issueDate: "", expiryDate: "" });
      setFiles([]);
      setFileError(undefined);
    }
  });

  return (
    <Section title="Upload a document" description="New documents are reviewed by an administrator before they count as approved.">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {subjects.length > 1 ? (
            <FormField label="This document is for" required error={errors.subject?.message}>
              <select
                className={controlClass}
                {...register("subject", { onChange: (event) => setValue("type", typesFor(parseSubject(event.target.value).kind)[0]) })}
              >
                {subjects.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </FormField>
          ) : null}
          <FormField label="Document type" required error={errors.type?.message}>
            <select className={controlClass} {...register("type")}>
              {typesFor(kind).map((type) => <option key={type} value={type}>{DOCUMENT_TYPE_LABELS[type]}</option>)}
            </select>
          </FormField>
          <FormField label="Title" required error={errors.title?.message} className={subjects.length > 1 ? "sm:col-span-2" : ""}>
            <input className={controlClass} aria-invalid={Boolean(errors.title)} placeholder="e.g. Certificate of incorporation" {...register("title")} />
          </FormField>
          <FormField label="Issue date" error={errors.issueDate?.message}>
            <input type="date" className={controlClass} {...register("issueDate")} />
          </FormField>
          <FormField label="Expiry date" hint="Leave empty if the document does not expire." error={errors.expiryDate?.message}>
            <input type="date" className={controlClass} aria-invalid={Boolean(errors.expiryDate)} {...register("expiryDate")} />
          </FormField>
        </div>
        <FilePicker label="File" files={files} onChange={(next) => { setFiles(next); setFileError(undefined); }} error={fileError} />
        <PrimaryButton type="submit" disabled={busy}>{busy ? "Uploading…" : "Upload document"}</PrimaryButton>
      </form>
    </Section>
  );
}
