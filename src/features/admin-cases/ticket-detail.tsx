"use client";

import { QueryBoundary } from "@/components/common/async-state";
import { controlClass } from "@/components/common/form-fields";
import { BackLink, DetailList, Section } from "@/components/common/layout-blocks";
import { StatusBadge, statusOptions } from "@/components/common/status-badge";
import { PageHeader } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDateTime } from "@/lib/format";
import { services } from "@/services";
import type { SupportTicket, TicketPriority, TicketStatus } from "@/types/ops";
import { useUserNames } from "../admin-platform/admin-page";
import { ROLE_LABEL, TICKET_CATEGORIES } from "./constants";
import { messageSchema } from "./schemas";
import { TextForm } from "./text-form";

export function TicketDetail({ id }: { id: string }) {
  const actor = useActor();
  const query = useServiceQuery(() => services.support.get(actor!, id), [actor?.id, id]);
  return (
    <>
      <BackLink href="/dashboard/admin/support">All tickets</BackLink>
      <div className="mt-4">
        <QueryBoundary query={query}>{(ticket) => <Body ticket={ticket} />}</QueryBoundary>
      </div>
    </>
  );
}

function Body({ ticket }: { ticket: SupportTicket }) {
  const actor = useActor()!;
  const name = useUserNames();
  const { adminProfiles } = useOps();
  const { run, busy } = useAction();
  const closed = ticket.status === "CLOSED";

  const update = (patch: { status?: TicketStatus; priority?: TicketPriority; assignedTo?: string }, success: string) =>
    run(() => services.support.update(actor, ticket.id, patch), { success });

  return (
    <>
      <PageHeader
        eyebrow={`Ticket ${ticket.ref}`}
        title={ticket.subject}
        subtitle={`Opened ${formatDateTime(ticket.createdAt)} by ${name(ticket.createdBy)} (${ROLE_LABEL[ticket.role]})`}
        actions={<><StatusBadge family="ticketPriority" status={ticket.priority} /><StatusBadge family="ticket" status={ticket.status} /></>}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Section title="Conversation">
          <ol className="space-y-3">
            {ticket.messages.map((message) => (
              <li key={message.id} className={`rounded-xl border px-4 py-3 text-sm ${message.byRole === "ADMIN" ? "border-brand/20 bg-brand-soft/50" : "border-line bg-background/60"}`}>
                <p className="font-semibold text-navy">{name(message.by)} <span className="font-normal text-muted">· {ROLE_LABEL[message.byRole]} · {formatDateTime(message.at)}</span></p>
                <p className="mt-1 whitespace-pre-line text-navy">{message.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-5">
            <TextForm
              schema={messageSchema}
              field="text"
              label="Reply to the customer"
              submitLabel="Send reply"
              success="Reply sent."
              disabled={closed}
              hint={closed ? "This ticket is closed. Change its status to reply." : "The customer is notified in the app."}
              onSubmit={(text) => services.support.reply(actor, ticket.id, text)}
            />
          </div>
        </Section>

        <aside className="space-y-6">
          <Section title="Manage ticket">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-navy">
                Status
                <select className={`${controlClass} mt-1.5`} value={ticket.status} disabled={busy} onChange={(event) => void update({ status: event.target.value as TicketStatus }, "Status updated.")}>
                  {statusOptions("ticket").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-navy">
                Priority
                <select className={`${controlClass} mt-1.5`} value={ticket.priority} disabled={busy} onChange={(event) => void update({ priority: event.target.value as TicketPriority }, "Priority updated.")}>
                  {statusOptions("ticketPriority").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-navy">
                Assigned to
                <select className={`${controlClass} mt-1.5`} value={ticket.assignedTo ?? ""} disabled={busy} onChange={(event) => event.target.value && void update({ assignedTo: event.target.value }, "Ticket assigned.")}>
                  <option value="">Unassigned</option>
                  {adminProfiles.map((profile) => <option key={profile.userId} value={profile.userId}>{name(profile.userId)}</option>)}
                </select>
              </label>
            </div>
          </Section>
          <Section title="Details">
            <DetailList
              columns={1}
              items={[
                { label: "Category", value: TICKET_CATEGORIES[ticket.category] },
                { label: "Related record", value: ticket.relatedRef ?? "None" },
                { label: "Last updated", value: formatDateTime(ticket.updatedAt) },
              ]}
            />
          </Section>
        </aside>
      </div>
    </>
  );
}
