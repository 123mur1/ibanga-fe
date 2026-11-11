"use client";

import Link from "next/link";
import { useState } from "react";
import { BookingBadge } from "@/components/status-badge";
import { useToast } from "@/components/toast";
import { ConfirmDialog, formatDate } from "@/components/ui";
import { Icon, RouteLine, StageProgress } from "@/features/importer-dashboard/kit";
import { DOCUMENT_KIND_LABEL, REQUIRED_DOCUMENTS, depositPaid, openBookingDocument } from "@/lib/booking-stage";
import { useIbanga } from "@/lib/store";
import type { Booking, BookingStatus } from "@/lib/types";
import { GpsShare } from "./gps-share";
import { TripUpdateDialog } from "./trip-update-dialog";

function Check({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${ok ? "bg-good text-white" : "bg-warn-soft text-warn ring-1 ring-warn/30"}`}>
        <Icon name={ok ? "check" : "clock"} className="h-3.5 w-3.5" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-navy">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </li>
  );
}

/** The trip the driver is on now (or next): route, readiness, documents and the trip actions. */
export function CurrentTrip({ booking, importerName }: { booking: Booking; importerName?: string }) {
  const { setBookingStatus } = useIbanga();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<BookingStatus | null>(null);
  const [composing, setComposing] = useState(false);
  const documents = booking.documents ?? [];
  const paid = depositPaid(booking);
  const docsReady = REQUIRED_DOCUMENTS.every((required) => documents.some((document) => document.kind === required.kind));
  const canStart = booking.status === "ACCEPTED" && paid && docsReady;
  const legs = booking.routeLegs ?? [];

  async function move(status: BookingStatus) {
    setBusy(true);
    try {
      const error = await setBookingStatus(booking.id, status);
      toast(error ?? (status === "IN_PROGRESS" ? "Trip started. Safe journey!" : "Delivery recorded. The importer confirms receipt."), error ? "bad" : "good");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  async function open(documentId: string) {
    try {
      await openBookingDocument(booking.id, documentId);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not open the document.", "bad");
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-card shadow-card animate-fade-in">
      <div className="bg-gradient-to-br from-brand via-brand-dark to-navy p-5 text-white sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{booking.status === "IN_PROGRESS" ? "On the road" : booking.status === "DELIVERED" ? "Delivered" : "Next trip"}</p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{booking.pickupCity ?? booking.pickupLocation} → {booking.destinationCity ?? booking.destination}</h2>
            <p className="mt-1 text-sm text-white/80">
              {formatDate(booking.pickupDate)} – {formatDate(booking.expectedDeliveryDate)} · {booking.cargoType}, {booking.cargoWeight} t{importerName ? ` · for ${importerName}` : ""}
            </p>
          </div>
          <span className="rounded-full bg-white p-0.5"><BookingBadge status={booking.status} /></span>
        </div>
        {booking.delays?.length ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-warn px-3 py-1 text-xs font-semibold text-white">
            <Icon name="alert" className="h-3.5 w-3.5" />
            Delayed {booking.delays.reduce((sum, delay) => sum + delay.delayDays, 0)} day(s) in total
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
        <div className="space-y-4">
          <RouteLine booking={booking} />
          {booking.truckLocation ? <p className="text-xs text-muted">The truck starts and ends at {booking.truckLocation}.</p> : null}
          {legs.length ? (
            <ol className="space-y-1.5 rounded-xl bg-background p-3 text-sm">
              {legs.map((leg, index) => (
                <li key={`${leg.from}-${index}`} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate text-muted">{index + 1}. {leg.from} → {leg.to}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-navy">{leg.km} km</span>
                </li>
              ))}
            </ol>
          ) : null}
          {booking.additionalInstructions ? (
            <p className="rounded-xl border border-line bg-background px-3 py-2 text-sm text-navy"><span className="font-semibold">Instructions: </span>{booking.additionalInstructions}</p>
          ) : null}
          <StageProgress booking={booking} />
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-navy">Ready to leave?</h3>
            <ul className="mt-2 space-y-2.5">
              <Check ok={paid} label="Deposit paid" hint={paid ? "50% held by iBanga." : "The importer pays 50% after the owner accepts."} />
              {REQUIRED_DOCUMENTS.map((required) => (
                <Check key={required.kind} ok={documents.some((document) => document.kind === required.kind)} label={required.label} hint={required.hint} />
              ))}
            </ul>
          </div>
          {documents.length ? (
            <ul className="flex flex-wrap gap-2">
              {documents.map((document) => (
                <li key={document.id}>
                  <button type="button" onClick={() => void open(document.id)} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line bg-background px-2.5 py-1.5 text-xs font-medium text-navy transition hover:border-brand hover:text-brand">
                    <Icon name="file" className="h-3.5 w-3.5" />
                    <span className="truncate">{DOCUMENT_KIND_LABEL[document.kind]}: {document.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 border-t border-line bg-background/50 p-5 sm:p-6">
        {booking.status === "IN_PROGRESS" ? <GpsShare bookingId={booking.id} /> : null}
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          {booking.status === "ACCEPTED" ? (
            <button type="button" disabled={!canStart || busy} onClick={() => setConfirm("IN_PROGRESS")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
              <Icon name="steering" className="h-4 w-4" /> Start trip
            </button>
          ) : null}
          {booking.status === "IN_PROGRESS" ? (
            <button type="button" disabled={busy} onClick={() => setConfirm("DELIVERED")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-good px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-good/90 disabled:opacity-50">
              <Icon name="check" className="h-4 w-4" /> Mark delivered
            </button>
          ) : null}
          {booking.status === "ACCEPTED" || booking.status === "IN_PROGRESS" ? (
            <button type="button" onClick={() => setComposing(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-navy transition hover:border-brand hover:text-brand">
              <Icon name="send" className="h-4 w-4" /> Send update or delay
            </button>
          ) : null}
          {booking.status === "IN_PROGRESS" || booking.status === "DELIVERED" ? (
            <Link href={`/dashboard/driver/delivery-evidence/sh-${booking.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-navy transition hover:border-brand hover:text-brand">
              <Icon name="file" className="h-4 w-4" /> Delivery evidence
            </Link>
          ) : null}
        </div>
        {booking.status === "ACCEPTED" && !canStart ? (
          <p className="text-xs text-warn">The trip can start once the deposit is paid and the cargo and tax documents are uploaded.</p>
        ) : null}
      </div>

      {composing ? <TripUpdateDialog booking={booking} onClose={() => setComposing(false)} /> : null}
      {confirm ? (
        <ConfirmDialog
          title={confirm === "IN_PROGRESS" ? "Start this trip?" : "Mark the cargo delivered?"}
          message={
            confirm === "IN_PROGRESS"
              ? "The importer and the owner see the trip as on the road. Share your location so they can follow it."
              : "The importer is asked to confirm receipt and pay the remaining 50%."
          }
          confirmLabel={confirm === "IN_PROGRESS" ? "Start trip" : "Mark delivered"}
          busy={busy}
          onConfirm={() => void move(confirm)}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </section>
  );
}
