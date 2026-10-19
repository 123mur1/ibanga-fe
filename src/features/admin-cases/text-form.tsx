"use client";

import type { z } from "zod";
import { controlClass, FormField } from "@/components/common/form-fields";
import { PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { applyFieldErrors, useZodForm } from "@/lib/forms";

/** One required text box with a submit button: replies, information requests, proposals, ticket replies. */
export function TextForm({
  schema,
  field,
  label,
  placeholder,
  submitLabel,
  success,
  disabled,
  hint,
  onSubmit,
}: {
  schema: z.ZodObject<Record<string, z.ZodString>>;
  field: string;
  label: string;
  placeholder?: string;
  submitLabel: string;
  success: string;
  disabled?: boolean;
  hint?: string;
  onSubmit: (text: string) => Promise<unknown>;
}) {
  const { run, busy } = useAction();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useZodForm(schema, { defaultValues: { [field]: "" } });
  const message = errors[field]?.message;

  const submit = handleSubmit(async (values) => {
    const done = await run(() => onSubmit(String((values as Record<string, unknown>)[field])), {
      success,
      toastError: false,
      onError: (error, fields) => {
        applyFieldErrors(setError, fields);
        if (!fields) setError(field, { type: "server", message: error instanceof Error ? error.message : "Could not save." });
      },
    });
    if (done !== undefined) reset();
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <FormField label={label} error={typeof message === "string" ? message : undefined} hint={hint}>
        <textarea
          className={`${controlClass} min-h-24 resize-y`}
          placeholder={placeholder}
          aria-invalid={Boolean(message)}
          disabled={disabled || busy}
          {...register(field)}
        />
      </FormField>
      <PrimaryButton type="submit" disabled={disabled || busy}>
        {busy ? "Saving…" : submitLabel}
      </PrimaryButton>
    </form>
  );
}
