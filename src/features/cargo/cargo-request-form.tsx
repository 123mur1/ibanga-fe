"use client";

import { useRouter } from "next/navigation";
import { FormProvider } from "react-hook-form";
import { Notice } from "@/components/common/notices";
import { GhostButton, PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { applyFieldErrors, useZodForm } from "@/lib/forms";
import { services } from "@/services";
import type { CargoRequest } from "@/types/ops";
import { AttachmentFields, CargoDetailsFields, HandlingFields, RouteFields, SizeFields } from "./cargo-fields";
import {
  EMPTY_CARGO_FORM,
  SERVICE_FIELD_MAP,
  cargoDraftSchema,
  cargoRequestSchema,
  looseToInput,
  outputToInput,
  requestToForm,
  type CargoFormInput,
} from "./schemas";

const DETAIL_HREF = (id: string) => `/dashboard/importer/cargo-requests/${id}`;

/**
 * Create or edit a cargo request. "Save draft" needs only a title; "Publish" (or "Save changes"
 * for an open request) needs the whole form to be valid. `existing` switches to edit mode.
 */
export function CargoRequestForm({ existing }: { existing?: CargoRequest }) {
  const router = useRouter();
  const actor = useActor();
  const { run, busy } = useAction();
  const isDraft = !existing || existing.status === "DRAFT";
  const form = useZodForm(cargoRequestSchema, { defaultValues: existing ? requestToForm(existing) : EMPTY_CARGO_FORM });
  const { handleSubmit, getValues, setError, formState } = form;

  function serviceErrors(_error: unknown, fields: Record<string, string> | undefined) {
    if (!fields) return;
    applyFieldErrors(
      setError,
      Object.fromEntries(Object.entries(fields).map(([key, message]) => [SERVICE_FIELD_MAP[key] ?? key, message])),
    );
  }

  const publish = handleSubmit(async (values) => {
    if (!actor) return;
    const input = outputToInput(values);
    const saved = await run(
      async () => {
        if (!existing) return services.cargoRequests.create(actor, input, false);
        const updated = await services.cargoRequests.update(actor, existing.id, input);
        return existing.status === "DRAFT" ? services.cargoRequests.publishDraft(actor, updated.id) : updated;
      },
      {
        success: existing && existing.status !== "DRAFT" ? "Changes saved." : "Request published. Truck owners can now send quotations.",
        onError: serviceErrors,
      },
    );
    if (saved) router.push(DETAIL_HREF(saved.id));
  });

  async function saveDraft() {
    if (!actor) return;
    const values = getValues() as CargoFormInput;
    const check = cargoDraftSchema.safeParse(values);
    if (!check.success) {
      setError("title", { type: "validate", message: check.error.issues[0]?.message ?? "Enter a title." });
      return;
    }
    const input = looseToInput(values);
    const saved = await run(
      () => (existing ? services.cargoRequests.update(actor, existing.id, input) : services.cargoRequests.create(actor, input, true)),
      { success: "Draft saved.", onError: serviceErrors },
    );
    if (saved) router.push(DETAIL_HREF(saved.id));
  }

  const hasErrors = Object.keys(formState.errors).length > 0;

  return (
    <FormProvider {...form}>
      <form onSubmit={(event) => void publish(event)} noValidate className="space-y-5">
        {hasErrors ? <Notice tone="danger" title="Some details need fixing">Check the highlighted fields below, then try again.</Notice> : null}
        <CargoDetailsFields />
        <RouteFields />
        <SizeFields />
        <HandlingFields />
        <AttachmentFields />
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5">
          <GhostButton type="button" disabled={busy} onClick={() => router.back()}>Cancel</GhostButton>
          {isDraft ? <GhostButton type="button" disabled={busy || !actor} onClick={() => void saveDraft()}>{busy ? "Saving…" : "Save draft"}</GhostButton> : null}
          <PrimaryButton type="submit" disabled={busy || !actor}>
            {busy ? "Saving…" : isDraft ? "Publish request" : "Save changes"}
          </PrimaryButton>
        </div>
      </form>
    </FormProvider>
  );
}
