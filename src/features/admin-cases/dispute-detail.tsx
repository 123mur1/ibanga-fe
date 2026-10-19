"use client";

import Link from "next/link";
import { QueryBoundary } from "@/components/common/async-state";
import { BackLink, DetailList, Section } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDateTime } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { DisputeCase } from "@/types/ops";
import { useUserNames } from "../admin-platform/admin-page";
import { DISPUTE_CATEGORIES, ROLE_LABEL } from "./constants";
import { AssignPanel, DecisionPanel, NoteForm, ResolutionPanel, StatusActions } from "./dispute-actions";
import { messageSchema } from "./schemas";
import { TextForm } from "./text-form";

export function DisputeDetail({ id }: { id: string }) {
  const actor = useActor();
  const query = useServiceQuery(() => services.disputes.get(actor!, id), [actor?.id, id]);
  return (
    <>
      <BackLink href="/dashboard/admin/disputes">All disputes</BackLink>
      <div className="mt-4">
        <QueryBoundary query={query}>{(dispute) => <Body dispute={dispute} />}</QueryBoundary>
      </div>
    </>
  );
}

function Body({ dispute }: { dispute: DisputeCase }) {
  const actor = useActor()!;
  const name = useUserNames();
  const { bookings } = useIbanga();
  const { shipments } = useOps();
  const booking = bookings.find((item) => item.id === dispute.bookingId);
  const shipment = shipments.find((item) => item.id === dispute.shipmentId);
  const closed = ["RESOLVED", "REJECTED"].includes(dispute.status);
  const hold = shipment?.settlementHold;

  return (
    <>
      <PageHeader
        eyebrow={`Dispute ${dispute.ref}`}
        title={DISPUTE_CATEGORIES[dispute.category]}
        subtitle={`Opened ${formatDateTime(dispute.createdAt)} by ${name(dispute.raisedBy)} (${ROLE_LABEL[dispute.raisedByRole]})`}
        actions={<StatusBadge family="dispute" status={dispute.status} />}
      />

      <div className="mt-5 space-y-3">
        {hold && !closed ? (
          <Notice tone="warning" title="Settlement is on hold">{hold}. The owner&apos;s payout stays blocked until this case is closed.</Notice>
        ) : closed ? (
          <Notice tone="success" title="Case closed">The hold from this dispute no longer applies. Any refund or payout is handled in its own workflow.</Notice>
        ) : (
          <Notice tone="info" title="No settlement hold found">The linked shipment does not currently show a hold.</Notice>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <Section title="What happened">
            <p className="whitespace-pre-line text-navy">{dispute.description}</p>
            <h3 className="mt-5 text-sm font-semibold text-muted">Evidence</h3>
            {dispute.evidence.length ? (
              <ul className="mt-2 grid gap-3 sm:grid-cols-2">
                {dispute.evidence.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="overflow-hidden rounded-lg border border-line">
                    {file.url.startsWith("data:image") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={file.url} alt={`Evidence: ${file.name}`} className="h-32 w-full object-cover" />
                    ) : null}
                    <a href={file.url} target="_blank" rel="noreferrer" className="block truncate px-3 py-2 text-sm font-semibold text-brand hover:text-brand-dark">{file.name}</a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted">No evidence attached.</p>
            )}
          </Section>

          <Section title="Conversation" description="Messages are visible to the importer and the truck owner.">
            {dispute.messages.length ? (
              <ol className="space-y-3">
                {dispute.messages.map((message) => (
                  <li key={message.id} className={`rounded-xl border px-4 py-3 text-sm ${message.by === actor.id ? "border-brand/20 bg-brand-soft/50" : "border-line bg-background/60"}`}>
                    <p className="font-semibold text-navy">{name(message.by)} <span className="font-normal text-muted">· {formatDateTime(message.at)}</span></p>
                    <p className="mt-1 whitespace-pre-line text-navy">{message.text}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">No messages yet.</p>
            )}
            <div className="mt-5">
              <TextForm
                schema={messageSchema}
                field="text"
                label="Reply to both parties"
                submitLabel="Send reply"
                success="Reply sent."
                disabled={closed}
                hint={closed ? "This case is closed." : undefined}
                onSubmit={(text) => services.disputes.reply(actor, dispute.id, text)}
              />
            </div>
          </Section>

          <Section title="Notes" description="Internal notes stay with administrators. Notes visible to the parties are shown to both sides.">
            {dispute.notes.length ? (
              <ul className="mb-5 space-y-3">
                {dispute.notes.map((note) => (
                  <li key={note.id} className="rounded-xl border border-line px-4 py-3 text-sm">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-navy">
                      {name(note.by)}
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${note.internal ? "bg-navy text-white" : "bg-good-soft text-good"}`}>{note.internal ? "Internal" : "Visible to parties"}</span>
                      <span className="font-normal text-muted">{formatDateTime(note.at)}</span>
                    </p>
                    <p className="mt-1 whitespace-pre-line text-navy">{note.text}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            <NoteForm dispute={dispute} />
          </Section>

          <ResolutionPanel dispute={dispute} />
          <DecisionPanel dispute={dispute} />
        </div>

        <aside className="min-w-0 space-y-6">
          <Section title="Parties and links">
            <DetailList
              columns={1}
              items={[
                { label: "Raised by", value: `${name(dispute.raisedBy)} (${ROLE_LABEL[dispute.raisedByRole]})` },
                { label: "Against", value: name(dispute.againstUserId) },
                { label: "Route", value: booking ? `${booking.pickupLocation} to ${booking.destination}` : "—" },
                {
                  label: "Booking",
                  value: booking ? <Link className="text-brand hover:text-brand-dark" href={`/dashboard/admin/bookings/${booking.id}`}>{booking.id}</Link> : dispute.bookingId,
                },
                {
                  label: "Shipment",
                  value: shipment ? <Link className="text-brand hover:text-brand-dark" href={`/dashboard/admin/shipments/${shipment.id}`}>{shipment.ref}</Link> : "No shipment yet",
                },
                {
                  label: "Payment",
                  value: booking?.payment ? <Link className="text-brand hover:text-brand-dark" href={`/dashboard/admin/payments/${booking.id}`}>{dispute.paymentRef ?? booking.payment.receiptNumber}</Link> : "No payment",
                },
              ]}
            />
          </Section>
          <AssignPanel dispute={dispute} />
          <StatusActions dispute={dispute} />
        </aside>
      </div>
    </>
  );
}
