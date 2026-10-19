"use client";

import { QueryBoundary } from "@/components/common/async-state";
import { ConfirmButton } from "@/components/common/confirm-button";
import { controlClass, FormField } from "@/components/common/form-fields";
import { Section } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { PLATFORM_FEE_RATE } from "@/config/business-rules";
import { PageHeader, PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { applyFieldErrors, useZodForm } from "@/lib/forms";
import { services } from "@/services";
import type { PlatformSettings } from "@/types/ops";
import { settingsSchema } from "./schemas";

export function SettingsView() {
  const query = useServiceQuery(() => services.admin.getSettings(), []);
  return (
    <>
      <PageHeader eyebrow="Platform" title="System settings" subtitle="Rules and messages that apply across the platform." />
      <div className="mt-6 space-y-6">
        <Notice tone="warning" title="Fee setting is informational">
          This setting is saved for display and audit history. Payment calculations currently use a {Math.round(PLATFORM_FEE_RATE * 100)}% platform fee.
        </Notice>
        <QueryBoundary query={query}>{(settings) => <SettingsForm settings={settings} />}</QueryBoundary>
        <ResetPanel />
      </div>
    </>
  );
}

function SettingsForm({ settings }: { settings: PlatformSettings }) {
  const actor = useActor()!;
  const { run, busy } = useAction();
  const { register, handleSubmit, reset, setError, formState: { errors, isDirty } } = useZodForm(settingsSchema, { defaultValues: settings });
  const num = { valueAsNumber: true } as const;

  const submit = handleSubmit(async (values) => {
    await run(() => services.admin.updateSettings(actor, values).then((saved) => { reset(saved); return saved; }), {
      success: "Settings saved.",
      toastError: false,
      onError: (error, fields) => {
        applyFieldErrors(setError, fields);
        if (!fields) setError("maintenanceBanner", { type: "server", message: error instanceof Error ? error.message : "Could not save." });
      },
    });
  });

  return (
    <Section title="Platform rules">
      <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
        <FormField label="Platform fee (%)" required error={errors.platformFeePct?.message} hint="Changes are saved to the settings history.">
          <input type="number" step="0.1" className={controlClass} aria-invalid={Boolean(errors.platformFeePct)} {...register("platformFeePct", num)} />
        </FormField>
        <FormField label="Quotation validity (days)" required error={errors.quotationValidityDays?.message}>
          <input type="number" className={controlClass} aria-invalid={Boolean(errors.quotationValidityDays)} {...register("quotationValidityDays", num)} />
        </FormField>
        <FormField label="Document warning (days before expiry)" required error={errors.documentWarningDays?.message}>
          <input type="number" className={controlClass} aria-invalid={Boolean(errors.documentWarningDays)} {...register("documentWarningDays", num)} />
        </FormField>
        <FormField label="Free cancellation window (hours)" required error={errors.cancellationFreeWindowHours?.message}>
          <input type="number" className={controlClass} aria-invalid={Boolean(errors.cancellationFreeWindowHours)} {...register("cancellationFreeWindowHours", num)} />
        </FormField>
        <FormField label="Maximum quotations per request" required error={errors.maxQuotationsPerRequest?.message}>
          <input type="number" className={controlClass} aria-invalid={Boolean(errors.maxQuotationsPerRequest)} {...register("maxQuotationsPerRequest", num)} />
        </FormField>
        <FormField label="Maintenance banner" error={errors.maintenanceBanner?.message} hint="Optional message shown to all users. Leave empty for none." className="sm:col-span-2">
          <input className={controlClass} aria-invalid={Boolean(errors.maintenanceBanner)} {...register("maintenanceBanner")} />
        </FormField>
        <div className="sm:col-span-2">
          <PrimaryButton type="submit" disabled={busy || !isDirty}>{busy ? "Saving…" : "Save settings"}</PrimaryButton>
        </div>
      </form>
    </Section>
  );
}

function ResetPanel() {
  const { run } = useAction();

  async function reset() {
    await services.admin.resetDemoData();
    try {
      window.localStorage.removeItem("ibanga-demo-session-v1");
    } catch {
      // Storage can be blocked; the reload still restarts from the seeded operations data.
    }
    window.location.reload();
  }

  return (
    <Section title="Reset records" description="Restore every record to its starting state.">
      <p className="mb-4 text-sm text-muted">
        This clears all bookings, payments, shipments, cases and settings you changed in this browser, signs the session data out and reloads the page. It does not affect any real system because none is connected.
      </p>
      <ConfirmButton
        tone="danger"
        label="Reset records"
        title="Reset all records?"
        message="Everything created or changed in this browser will be lost."
        summary={["Marketplace and operations data return to the seed.", "The page reloads and you may need to sign in again."]}
        confirmLabel="Reset and reload"
        onConfirm={() => run(reset, { success: "Records reset." })}
      />
    </Section>
  );
}
