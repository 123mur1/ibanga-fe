"use client";

import { useState } from "react";
import { Notice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { PrimaryButton } from "@/components/ui";
import { useOps } from "@/hooks/use-ops";
import { formatDate, formatDateTime, formatRwf } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import type { CargoRequest, Quotation } from "@/types/ops";
import { AcceptQuotationDialog } from "./accept-quotation-dialog";

function difference(amount: number, reference: number | undefined, noun: string) {
  if (reference === undefined) return null;
  const delta = amount - reference;
  if (delta === 0) return { text: `Equal to ${noun}`, tone: "text-muted" };
  return delta < 0
    ? { text: `${formatRwf(-delta)} below ${noun}`, tone: "text-good" }
    : { text: `${formatRwf(delta)} above ${noun}`, tone: "text-bad" };
}

/**
 * Quotations for one request, cheapest first, with the difference from the cheapest offer and
 * from the importer's budget. Every card says it is a quotation, not a booking.
 */
export function QuotationComparison({ request, quotations, onBooked }: { request: CargoRequest; quotations: Quotation[]; onBooked: (bookingId: string) => void }) {
  const { users, trucks } = useIbanga();
  const ops = useOps();
  const [reviewing, setReviewing] = useState<Quotation | null>(null);
  // Captured once so render stays pure; good enough to grey out offers that lapsed while the page was open.
  const [now] = useState(() => Date.now());

  const sorted = [...quotations].sort((a, b) => a.amountRwf - b.amountRwf);
  const live = sorted.filter((quote) => quote.status === "SUBMITTED" && new Date(quote.validUntil).getTime() >= now);
  const cheapest = live[0]?.amountRwf ?? sorted[0]?.amountRwf;
  const canAccept = ["OPEN", "QUOTED"].includes(request.status);

  if (!sorted.length) {
    return <p className="text-sm text-muted">No quotations yet. Truck owners with a suitable truck will reply here. You will get a notification for each one.</p>;
  }

  const ownerName = (quote: Quotation) => {
    const owner = users.find((user) => user.id === quote.ownerId);
    return owner?.company ?? owner?.name ?? "Truck owner";
  };

  return (
    <div className="space-y-4">
      <Notice tone="info" title="Quotation, not a booking">
        These are price offers. Nothing is booked or charged until you accept one and then pay. Offers are sorted from the lowest price.
      </Notice>
      <ul className="grid gap-4 xl:grid-cols-2">
        {sorted.map((quote) => {
          const truck = trucks.find((item) => item.id === quote.truckId);
          // Importers cannot see owners' documents, so this comes from the API's truck record.
          const verification = truck?.verification ?? "NOT_SUBMITTED";
          const driver = ops.drivers.find((item) => item.id === quote.driverId);
          const expired = quote.status === "SUBMITTED" && new Date(quote.validUntil).getTime() < now;
          const open = quote.status === "SUBMITTED" && !expired;
          const vsCheapest = difference(quote.amountRwf, cheapest, "the lowest offer");
          const vsBudget = difference(quote.amountRwf, request.budgetRwf, "your budget");
          return (
            <li key={quote.id} className={`rounded-2xl border bg-card p-5 shadow-soft ${quote.status === "ACCEPTED" ? "border-good/50" : "border-line"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Quotation {quote.ref} · not a booking</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-navy">{formatRwf(quote.amountRwf)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {open && quote.id === live[0]?.id ? <span className="rounded-full bg-good-soft px-2.5 py-1 text-xs font-semibold text-good">Lowest price</span> : null}
                  <StatusBadge family="quotation" status={expired ? "EXPIRED" : quote.status} />
                </div>
              </div>

              <div className="mt-2 space-y-0.5 text-sm">
                {vsCheapest && quote.amountRwf !== cheapest ? <p className={vsCheapest.tone}>{vsCheapest.text}</p> : null}
                {vsBudget ? <p className={vsBudget.tone}>{vsBudget.text}</p> : null}
              </div>

              <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <Info label="Owner company" value={ownerName(quote)} extra={<StatusBadge family="verification" status={verification} />} />
                <Info label="Truck" value={truck ? `${truck.plateNumber} · ${truck.truckType}` : "—"} extra={truck ? <span className="text-xs text-muted">{truck.capacity} t capacity</span> : undefined} />
                <Info label="Driver" value={driver ? driver.name : "Not named yet"} />
                <Info label="Valid until" value={formatDateTime(quote.validUntil)} />
                <Info label="Pickup" value={formatDate(quote.estimatedPickupDate)} />
                <Info label="Delivery" value={formatDate(quote.estimatedDeliveryDate)} />
              </dl>
              {quote.notes ? <p className="mt-3 rounded-lg bg-background/70 px-3 py-2 text-sm text-navy">“{quote.notes}”</p> : null}
              {verification !== "APPROVED" ? <div className="mt-3"><Notice tone="warning" title="Truck not fully verified">Check the owner&apos;s documents before you accept.</Notice></div> : null}

              {open && canAccept ? (
                <div className="mt-4 flex justify-end">
                  <PrimaryButton type="button" onClick={() => setReviewing(quote)}>Review and accept</PrimaryButton>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {reviewing ? (
        <AcceptQuotationDialog
          request={request}
          quotation={reviewing}
          ownerName={ownerName(reviewing)}
          onClose={() => setReviewing(null)}
          onBooked={(bookingId) => {
            setReviewing(null);
            onBooked(bookingId);
          }}
        />
      ) : null}
    </div>
  );
}

function Info({ label, value, extra }: { label: string; value: string; extra?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 flex flex-wrap items-center gap-2 font-semibold text-navy">
        <span className="break-words">{value}</span>
        {extra}
      </dd>
    </div>
  );
}
