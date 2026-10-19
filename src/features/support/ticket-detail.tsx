"use client";

import { BackLink, DetailList, Section } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { QueryBoundary } from "@/components/common/async-state";
import { RoleShell } from "@/components/common/role-shell";
import { ConfirmButton } from "@/components/common/confirm-button";
import { StatusBadge } from "@/components/common/status-badge";
import { controlClass, FormField } from "@/components/common/form-fields";
import { PageHeader, PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDateTime } from "@/lib/format";
import { useZodForm } from "@/lib/forms";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import { CATEGORY_LABELS, replySchema } from "./schemas";
import { portalBase, type PortalRole } from "./portal";

export function TicketDetail({ role, id }: { role: PortalRole; id: string }) {
  const actor = useActor();
  const { users } = useIbanga();
  const base = portalBase(role);
  const { run, busy } = useAction();
  const query = useServiceQuery(() => services.support.get(actor!, id), [actor?.id, id]);
  const { register, handleSubmit, reset, formState: { errors } } = useZodForm(replySchema, { defaultValues: { text: "" } });

  const send = handleSubmit(async (values) => {
    if (!actor) return;
    const done = await run(() => services.support.reply(actor, id, values.text), { success: "Reply sent." });
    if (done) reset();
  });

  return (
    <RoleShell role={role}>
      <BackLink href={`${base}/support`}>All tickets</BackLink>
      <div className="mt-4">
        <QueryBoundary query={query}>
          {(ticket) => (
            <>
              <PageHeader
                eyebrow={ticket.ref}
                title={ticket.subject}
                subtitle={`Opened ${formatDateTime(ticket.createdAt)}`}
                actions={<StatusBadge family="ticket" status={ticket.status} />}
              />
              <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,1fr)]">
                <Section title="Conversation" description="Demonstration conversation: replies are stored in this browser and no real agent is reading.">
                  <ol className="space-y-4" aria-label="Messages">
                    {ticket.messages.map((message) => {
                      const mine = message.by === actor?.id;
                      const name = message.byRole === "ADMIN" ? "iBanga support" : (users.find((user) => user.id === message.by)?.name ?? "Customer");
                      return (
                        <li key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm border border-line bg-background text-navy"}`}>
                            <p className={`text-xs font-semibold ${mine ? "text-white/80" : "text-muted"}`}>{mine ? "You" : name} · {formatDateTime(message.at)}</p>
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  {ticket.status === "CLOSED" ? (
                    <div className="mt-5"><Notice title="This ticket is closed">Open a new ticket if you need more help.</Notice></div>
                  ) : (
                    <form onSubmit={send} noValidate className="mt-6 space-y-3 border-t border-line pt-5">
                      <FormField label="Reply" error={errors.text?.message}>
                        <textarea className={`${controlClass} min-h-24 resize-y`} aria-invalid={Boolean(errors.text)} {...register("text")} />
                      </FormField>
                      <div className="flex flex-wrap gap-3">
                        <PrimaryButton type="submit" disabled={busy}>{busy ? "Sending…" : "Send reply"}</PrimaryButton>
                        <ConfirmButton
                          variant="ghost"
                          label="Close ticket"
                          title="Close this ticket?"
                          message="You will not be able to reply after the ticket is closed."
                          summary={["Support will no longer see new messages on it.", "You can open a new ticket at any time."]}
                          disabled={busy}
                          onConfirm={() => run(() => services.support.update(actor!, ticket.id, { status: "CLOSED" }), { success: "Ticket closed." })}
                        />
                      </div>
                    </form>
                  )}
                </Section>
                <Section title="Details">
                  <DetailList
                    columns={1}
                    items={[
                      { label: "Category", value: CATEGORY_LABELS[ticket.category] },
                      { label: "Priority", value: <StatusBadge family="ticketPriority" status={ticket.priority} /> },
                      { label: "Related reference", value: ticket.relatedRef },
                      { label: "Last updated", value: formatDateTime(ticket.updatedAt) },
                    ]}
                  />
                </Section>
              </div>
            </>
          )}
        </QueryBoundary>
      </div>
    </RoleShell>
  );
}
