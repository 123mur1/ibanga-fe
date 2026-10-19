"use client";

import { useState } from "react";
import { ConfirmButton } from "@/components/common/confirm-button";
import { controlClass, FormField } from "@/components/common/form-fields";
import { Notice } from "@/components/common/notices";
import { useIbanga } from "@/lib/store";
import { noteSchema } from "./schemas";

export function NoPermissionNotice({ area }: { area: string }) {
  return (
    <Notice tone="warning" title="View only">
      Your administrator role does not include {area}. You can read these records but not act on them.
    </Notice>
  );
}

/** Resolves a user ID to a display name (the marketplace store owns users). */
export function useUserName() {
  const { users } = useIbanga();
  return (id: string | undefined) => (id ? (users.find((user) => user.id === id)?.name ?? "Unknown user") : "—");
}

/**
 * A required note field next to a ConfirmButton. The action stays disabled until the note passes
 * validation, so an invalid request is never submitted.
 */
export function NoteAction({
  fieldLabel,
  placeholder,
  errorMessage,
  label,
  title,
  message,
  summary,
  tone = "brand",
  variant = "primary",
  disabled,
  onConfirm,
}: {
  fieldLabel: string;
  placeholder?: string;
  errorMessage: string;
  label: string;
  title: string;
  message: string;
  summary?: (note: string) => string[];
  tone?: "brand" | "danger";
  variant?: "primary" | "ghost";
  disabled?: boolean;
  onConfirm: (note: string) => Promise<unknown>;
}) {
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const parsed = noteSchema(errorMessage).safeParse(note);
  const error = touched && !parsed.success ? parsed.error.issues[0]?.message : undefined;
  return (
    <div className="space-y-3">
      <FormField label={fieldLabel} error={error} required>
        <textarea
          rows={2}
          value={note}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          placeholder={placeholder}
          onChange={(event) => setNote(event.target.value)}
          onBlur={() => setTouched(true)}
          className={controlClass}
        />
      </FormField>
      <ConfirmButton
        label={label}
        title={title}
        message={message}
        summary={summary?.(note.trim())}
        tone={tone}
        variant={variant}
        disabled={disabled || !parsed.success}
        onConfirm={async () => {
          // useAction resolves to undefined when the service failed: keep the note for another try.
          const result = await onConfirm(note.trim());
          if (result === undefined) return;
          setNote("");
          setTouched(false);
        }}
      />
    </div>
  );
}

export function toneForCount(count: number): "good" | "warn" {
  return count > 0 ? "warn" : "good";
}
