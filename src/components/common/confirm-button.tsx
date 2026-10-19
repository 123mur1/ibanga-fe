"use client";

import { useState } from "react";
import { ConfirmDialog, GhostButton, PrimaryButton } from "@/components/ui";

/**
 * Button that asks for confirmation before running `onConfirm`. Use it for every destructive or
 * financially sensitive action (cancellations, refunds, payouts, reassigning an active driver).
 * `summary` lists what will happen so the user confirms with full information.
 */
export function ConfirmButton({
  label,
  title,
  message,
  summary,
  confirmLabel,
  tone = "brand",
  variant = "primary",
  disabled,
  className = "",
  onConfirm,
}: {
  label: string;
  title: string;
  message: string;
  summary?: string[];
  confirmLabel?: string;
  tone?: "brand" | "danger";
  variant?: "primary" | "ghost";
  disabled?: boolean;
  className?: string;
  onConfirm: () => Promise<unknown> | void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const Trigger = variant === "primary" ? PrimaryButton : GhostButton;

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <>
      <Trigger type="button" disabled={disabled} className={className} onClick={() => setOpen(true)}>
        {label}
      </Trigger>
      {open ? (
        <ConfirmDialog
          title={title}
          message={summary?.length ? `${message}\n\n${summary.map((line) => `• ${line}`).join("\n")}` : message}
          confirmLabel={confirmLabel ?? label}
          tone={tone}
          busy={busy}
          onConfirm={() => void confirm()}
          onCancel={() => !busy && setOpen(false)}
        />
      ) : null}
    </>
  );
}
