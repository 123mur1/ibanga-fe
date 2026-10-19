"use client";

import { useState } from "react";
import { ConfirmButton } from "@/components/common/confirm-button";
import { controlClass, FormField } from "@/components/common/form-fields";

type Action = { label: string; title: string; message: string; summary?: string[] };

/**
 * Approve / reject controls where rejection needs a written reason (at least 5 characters).
 * The reason is validated here and again by the service.
 */
export function ReasonReview({
  approve,
  reject,
  onApprove,
  onReject,
  disabled,
  reasonLabel = "Reason for rejection",
}: {
  approve: Action;
  reject: Action;
  onApprove: () => Promise<unknown>;
  onReject: (reason: string) => Promise<unknown>;
  disabled?: boolean;
  reasonLabel?: string;
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const valid = reason.trim().length >= 5;
  return (
    <div className="space-y-4">
      <FormField
        label={reasonLabel}
        required
        hint="Shown to the applicant. Required only when rejecting."
        error={touched && !valid ? "Enter at least 5 characters explaining the decision." : undefined}
      >
        <textarea
          rows={3}
          value={reason}
          disabled={disabled}
          onChange={(event) => setReason(event.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={touched && !valid}
          className={controlClass}
        />
      </FormField>
      <div className="flex flex-wrap gap-3">
        <ConfirmButton {...approve} disabled={disabled} onConfirm={onApprove} />
        <ConfirmButton
          {...reject}
          variant="ghost"
          tone="danger"
          disabled={disabled || !valid}
          onConfirm={async () => {
            await onReject(reason.trim());
            setReason("");
            setTouched(false);
          }}
        />
      </div>
      {!valid ? <p className="text-xs text-muted">The reject button unlocks once a reason is written.</p> : null}
    </div>
  );
}
