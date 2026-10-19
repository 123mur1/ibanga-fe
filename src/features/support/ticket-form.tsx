"use client";

import { useRouter } from "next/navigation";
import { BackLink, Section } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { RoleShell } from "@/components/common/role-shell";
import { controlClass, FormField } from "@/components/common/form-fields";
import { GhostButton, PageHeader, PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { applyFieldErrors, useZodForm } from "@/lib/forms";
import { services } from "@/services";
import { CATEGORY_LABELS, PRIORITY_LABELS, TICKET_CATEGORIES, TICKET_PRIORITIES, ticketSchema } from "./schemas";
import { portalBase, type PortalRole } from "./portal";

export function TicketForm({ role }: { role: PortalRole }) {
  const actor = useActor();
  const router = useRouter();
  const base = portalBase(role);
  const { run, busy } = useAction();
  const { register, handleSubmit, setError, formState: { errors } } = useZodForm(ticketSchema, {
    defaultValues: { subject: "", category: "BOOKING", priority: "NORMAL", relatedRef: "", message: "" },
  });

  const submit = handleSubmit(async (values) => {
    if (!actor) return;
    const ticket = await run(
      () => services.support.create(actor, { ...values, relatedRef: values.relatedRef || undefined }),
      { success: "Ticket created.", onError: (_error, fields) => applyFieldErrors(setError, fields) },
    );
    if (ticket) router.push(`${base}/support/${ticket.id}`);
  });

  return (
    <RoleShell role={role}>
      <BackLink href={`${base}/support`}>All tickets</BackLink>
      <div className="mt-4">
        <PageHeader eyebrow="Help" title="New support ticket" subtitle="Tell us what happened and which booking or payment it relates to." />
      </div>
      <form onSubmit={submit} noValidate className="mt-6 max-w-3xl space-y-5">
        <Notice title="Demonstration">Tickets are stored in this browser only. No real support agent will read them.</Notice>
        <Section title="Ticket details">
          <div className="space-y-4">
            <FormField label="Subject" required error={errors.subject?.message}>
              <input className={controlClass} aria-invalid={Boolean(errors.subject)} {...register("subject")} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Category" error={errors.category?.message}>
                <select className={controlClass} {...register("category")}>
                  {TICKET_CATEGORIES.map((key) => <option key={key} value={key}>{CATEGORY_LABELS[key]}</option>)}
                </select>
              </FormField>
              <FormField label="Priority" error={errors.priority?.message}>
                <select className={controlClass} {...register("priority")}>
                  {TICKET_PRIORITIES.map((key) => <option key={key} value={key}>{PRIORITY_LABELS[key]}</option>)}
                </select>
              </FormField>
              <FormField label="Related reference" hint="Booking, shipment or payment reference" error={errors.relatedRef?.message}>
                <input className={controlClass} aria-invalid={Boolean(errors.relatedRef)} {...register("relatedRef")} />
              </FormField>
            </div>
            <FormField label="Message" required error={errors.message?.message}>
              <textarea className={`${controlClass} min-h-36 resize-y`} aria-invalid={Boolean(errors.message)} {...register("message")} />
            </FormField>
          </div>
        </Section>
        <div className="flex flex-wrap gap-3">
          <PrimaryButton type="submit" disabled={busy}>{busy ? "Sending…" : "Create ticket"}</PrimaryButton>
          <GhostButton type="button" disabled={busy} onClick={() => router.push(`${base}/support`)}>Cancel</GhostButton>
        </div>
      </form>
    </RoleShell>
  );
}
