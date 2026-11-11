"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { formatRange } from "@/components/availability-calendar";
import { DEPOSIT_WINDOW_MINUTES } from "@/lib/booking-stage";
import { formatPlace } from "@/lib/locations";
import { formatRwf } from "@/lib/payments";
import type { TripQuote, Truck } from "@/lib/types";
import type { StepId, WizardForm } from "./state";

const PAYMENT_STEPS = [
  { title: "Send the request", text: "Nothing is paid now. The owner reviews your request." },
  { title: `Pay 50% within ${DEPOSIT_WINDOW_MINUTES / 60} hour`, text: "Once the owner accepts, pay the deposit within the hour. If not, the booking is cancelled and the dates are freed." },
  { title: "Upload your documents", text: "After the deposit, add the cargo and tax documents. The trip starts once they are in." },
  { title: "Receive, then pay the rest", text: "When the cargo arrives, confirm receipt and pay the remaining 50%." },
];

function Row({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</dt>
        <dd className="mt-0.5 break-words text-sm font-semibold text-navy">{value}</dd>
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-brand hover:bg-brand-soft">Edit</button>
    </div>
  );
}

export function ReviewStep({ truck, form, quote, goTo }: { truck: Truck; form: WizardForm; quote: TripQuote | null; goTo: (step: StepId) => void }) {
  return (
    <div className="space-y-5">
      <dl className="divide-y divide-line rounded-xl border border-line bg-background/60 px-4">
        <Row label="Dates" value={form.dates ? formatRange(form.dates) : "—"} onEdit={() => goTo("dates")} />
        <Row label="Truck starts from" value={formatPlace({ city: truck.currentLocation })} onEdit={() => goTo("route")} />
        <Row label="Pickup" value={formatPlace(form.pickup)} onEdit={() => goTo("route")} />
        <Row label="Final destination" value={formatPlace(form.destination)} onEdit={() => goTo("route")} />
        <Row label="Cargo" value={`${form.cargoType} · ${form.cargoWeight} tons${form.cargoDescription ? ` · ${form.cargoDescription}` : ""}`} onEdit={() => goTo("cargo")} />
        {form.additionalInstructions ? <Row label="Driver instructions" value={form.additionalInstructions} onEdit={() => goTo("cargo")} /> : null}
        <Row label="Trip price" value={quote ? `${formatRwf(quote.priceRwf)} · ${quote.km.toLocaleString("en-RW")} km round trip` : "—"} onEdit={() => goTo("route")} />
      </dl>
      <section aria-labelledby="how-payment-works" className="rounded-2xl border border-brand/20 bg-brand-soft/50 p-4 sm:p-5">
        <h3 id="how-payment-works" className="font-display text-lg text-navy">How payment works</h3>
        <ol className="stagger mt-3 space-y-3">
          {PAYMENT_STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{index + 1}</span>
              <div>
                <p className="text-sm font-semibold text-navy">
                  {step.title}
                  {quote && index === 1 ? <span className="ml-2 tabular-nums text-brand">{formatRwf(quote.depositRwf)}</span> : null}
                  {quote && index === 3 ? <span className="ml-2 tabular-nums text-brand">{formatRwf(quote.balanceRwf)}</span> : null}
                </p>
                <p className="text-sm text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-muted">Payments on iBanga are simulated. iBanga holds the money until you confirm delivery.</p>
      </section>
    </div>
  );
}

/** Shown once the request is saved: an animated check, what happens next, where to go. */
export function SuccessDialog({ deposit, onBrowse }: { deposit: number | null; onBrowse: () => void }) {
  const primary = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    primary.current?.focus();
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4 backdrop-blur-sm animate-backdrop-in" role="dialog" aria-modal="true" aria-labelledby="request-sent-title">
      <div className="w-full max-w-md animate-pop-in rounded-3xl bg-card p-6 text-center shadow-card sm:p-8">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-good-soft">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-good" aria-hidden="true">
            <path className="animate-check-draw" d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h2 id="request-sent-title" className="mt-5 font-display text-2xl text-navy">Request sent</h2>
        <p className="mt-2 text-sm text-muted">The owner has been notified and will accept or decline. We will email you as soon as they answer.</p>
        <div className="mt-5 rounded-xl bg-warn-soft px-4 py-3 text-left text-sm text-navy">
          <p className="font-semibold">Next: be ready to pay the deposit</p>
          <p className="mt-0.5 text-muted">
            After the owner accepts you have {DEPOSIT_WINDOW_MINUTES / 60} hour to pay {deposit ? formatRwf(deposit) : "50% of the price"}, or the booking is cancelled.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <Link ref={primary} href="/dashboard/importer/bookings" className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30">
            View my bookings
          </Link>
          <button type="button" onClick={onBrowse} className="flex-1 rounded-xl border border-line px-4 py-3 text-sm font-semibold text-navy transition hover:border-brand hover:text-brand">
            Keep browsing
          </button>
        </div>
      </div>
    </div>
  );
}
