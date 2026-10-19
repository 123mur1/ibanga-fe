"use client";

import Link from "next/link";
import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { FilePicker, controlClass, FormField } from "@/components/common/form-fields";
import { BackLink, DetailList, Section } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { RoleShell } from "@/components/common/role-shell";
import { StatusBadge } from "@/components/common/status-badge";
import { PageHeader, PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDateTime, formatRwf, titleCase } from "@/lib/format";
import { useZodForm, type PickedFile } from "@/lib/forms";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import { portalBase, type PortalRole } from "@/features/support/portal";
import type { DisputeCase, EvidenceFile } from "@/types/ops";
import { DISPUTE_CATEGORY_LABELS, disputeReplySchema } from "./schemas";

function EvidenceList({ files }: { files: EvidenceFile[] }) {
  if (!files.length) return <p className="text-sm text-muted">No evidence was attached.</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {files.map((file, index) => (
        <li key={`${file.name}-${index}`} className="overflow-hidden rounded-lg border border-line bg-white">
          {/^data:image|\.(png|jpe?g|webp|gif)$/i.test(file.url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.url} alt={`Evidence: ${file.name}`} className="h-28 w-full object-cover" />
          ) : null}
          <a href={file.url} target="_blank" rel="noreferrer" className="block truncate px-2.5 py-2 text-xs font-semibold text-brand hover:text-brand-dark" title={file.name}>
            {file.name}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function DisputeDetail({ role, id }: { role: PortalRole; id: string }) {
  const actor = useActor();
  const base = portalBase(role);
  const query = useServiceQuery(() => services.disputes.get(actor!, id), [actor?.id, id]);
  return (
    <RoleShell role={role}>
      <BackLink href={`${base}/disputes`}>All disputes</BackLink>
      <div className="mt-4">
        <QueryBoundary query={query}>{(dispute) => <DisputeBody dispute={dispute} base={base} />}</QueryBoundary>
      </div>
    </RoleShell>
  );
}

function DisputeBody({ dispute, base }: { dispute: DisputeCase; base: string }) {
  const actor = useActor();
  const { users } = useIbanga();
  const ops = useOps();
  const { run, busy } = useAction();
  const [extra, setExtra] = useState<PickedFile[]>([]);
  const { register, handleSubmit, reset, formState: { errors } } = useZodForm(disputeReplySchema, { defaultValues: { text: "" } });

  const closed = ["RESOLVED", "REJECTED"].includes(dispute.status);
  const nameOf = (userId?: string) => (userId === actor?.id ? "You" : (users.find((user) => user.id === userId)?.name ?? "Unknown"));
  const shipment = ops.shipments.find((item) => item.id === dispute.shipmentId || item.bookingId === dispute.bookingId);
  const settlement = ops.settlements.find((item) => item.bookingId === dispute.bookingId);
  const hold = shipment?.settlementHold ?? (settlement?.status === "ON_HOLD" ? settlement.holdReason : undefined);

  const send = handleSubmit(async (values) => {
    if (!actor) return;
    const done = await run(
      () => services.disputes.reply(actor, dispute.id, values.text, extra.map((file) => ({ name: file.name, url: file.url }))),
      { success: dispute.infoRequest && dispute.status === "AWAITING_INFO" ? "Answer sent." : "Message sent." },
    );
    if (done) {
      reset();
      setExtra([]);
    }
  });

  const thread = [
    ...dispute.messages.map((message) => ({ id: message.id, at: message.at, by: message.by, text: message.text, note: false })),
    ...dispute.notes.map((note) => ({ id: note.id, at: note.at, by: note.by, text: note.text, note: true })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const answering = dispute.status === "AWAITING_INFO" && Boolean(dispute.infoRequest);

  return (
    <>
      <PageHeader eyebrow={dispute.ref} title={DISPUTE_CATEGORY_LABELS[dispute.category]} subtitle={`Opened ${formatDateTime(dispute.createdAt)}`} actions={<StatusBadge family="dispute" status={dispute.status} />} />
      <div className="mt-5 space-y-3">
        {hold && !closed ? (
          <Notice tone="warning" title="Settlement on hold">
            The truck owner&apos;s settlement for this booking is held while this dispute is open. {hold}
          </Notice>
        ) : null}
        {answering ? (
          <Notice tone="danger" title="An administrator needs more information">
            {dispute.infoRequest} Answer in the reply box below.
          </Notice>
        ) : null}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,1fr)]">
        <div className="space-y-5">
          <Section title="What happened">
            <p className="whitespace-pre-wrap break-words leading-7 text-navy">{dispute.description}</p>
          </Section>
          <Section title="Evidence" description="Files attached by the parties. Demonstration files stay in this browser.">
            <EvidenceList files={dispute.evidence} />
          </Section>
          <Section title="Messages" description="Replies from you, the other party and iBanga administrators.">
            {thread.length ? (
              <ol className="space-y-4" aria-label="Case messages">
                {thread.map((entry) => {
                  const mine = entry.by === actor?.id;
                  return (
                    <li key={entry.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm border border-line bg-background text-navy"}`}>
                        <p className={`text-xs font-semibold ${mine ? "text-white/80" : "text-muted"}`}>
                          {entry.note ? "iBanga note" : nameOf(entry.by)} · {formatDateTime(entry.at)}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{entry.text}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-sm text-muted">No messages yet.</p>
            )}
            {closed ? (
              <div className="mt-5"><Notice title="This dispute is closed">New messages cannot be added. Open a support ticket if something is still wrong.</Notice></div>
            ) : (
              <form onSubmit={send} noValidate className="mt-6 space-y-3 border-t border-line pt-5">
                <FormField label={answering ? "Your answer to the information request" : "Reply"} error={errors.text?.message}>
                  <textarea className={`${controlClass} min-h-24 resize-y`} aria-invalid={Boolean(errors.text)} {...register("text")} />
                </FormField>
                <FilePicker label="Additional evidence (optional)" files={extra} onChange={setExtra} multiple />
                <PrimaryButton type="submit" disabled={busy}>{busy ? "Sending…" : answering ? "Send answer" : "Send reply"}</PrimaryButton>
              </form>
            )}
          </Section>
        </div>
        <aside className="space-y-5">
          <Section title="Case details">
            <DetailList
              columns={1}
              items={[
                { label: "Raised by", value: nameOf(dispute.raisedBy) },
                { label: "Against", value: nameOf(dispute.againstUserId) },
                { label: "Booking", value: <Link className="text-brand hover:text-brand-dark" href={`${base}/bookings/${dispute.bookingId}`}>View booking</Link> },
                { label: "Shipment", value: shipment ? <Link className="text-brand hover:text-brand-dark" href={`${base}/shipments/${shipment.id}`}>{shipment.ref}</Link> : "No shipment yet" },
                { label: "Payment reference", value: dispute.paymentRef },
                { label: "Settlement", value: settlement ? <StatusBadge family="settlement" status={settlement.status} /> : "Not created yet" },
                { label: "Last updated", value: formatDateTime(dispute.updatedAt) },
              ]}
            />
          </Section>
          {dispute.proposedResolution ? (
            <Section title="Proposed resolution">
              <p className="whitespace-pre-wrap text-sm leading-6 text-navy">{dispute.proposedResolution}</p>
              <p className="mt-2 text-xs text-muted">This is a proposal from the administrator. Reply in the thread if you agree or object.</p>
            </Section>
          ) : null}
          {dispute.decision ? (
            <Section title="Decision">
              <DetailList
                columns={1}
                items={[
                  { label: "Outcome", value: titleCase(dispute.decision.type) },
                  { label: "Amount", value: dispute.decision.amountRwf ? formatRwf(dispute.decision.amountRwf) : "No amount" },
                  { label: "Note", value: dispute.decision.note },
                  { label: "Recorded", value: formatDateTime(dispute.decision.at) },
                ]}
              />
              <div className="mt-4">
                <Notice title="A recorded decision does not move money">Refunds and payouts are separate steps that must still be processed and are simulated in this demonstration.</Notice>
              </div>
            </Section>
          ) : null}
        </aside>
      </div>
    </>
  );
}
