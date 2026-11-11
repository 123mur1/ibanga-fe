"use client";

import Link from "next/link";
import {
  balanceAmount,
  bookingStage,
  depositAmount,
  depositDeadline,
  formatCountdown,
  missingDocuments,
  openDelayImpacts,
} from "@/lib/booking-stage";
import { bookingPlaces } from "@/lib/locations";
import { formatRwf } from "@/lib/payments";
import type { Booking } from "@/lib/types";
import { EmptyNote, Icon, Panel, useTicker } from "./kit";

type Action = {
  key: string;
  bookingId: string;
  urgency: number;
  tone: "bad" | "warn" | "brand" | "good";
  icon: Parameters<typeof Icon>[0]["name"];
  title: string;
  detail: string;
  amount?: string;
  cta: string;
  deadline?: Date;
};

const TONE = {
  bad: { card: "border-bad/25 bg-bad-soft/60", icon: "bg-bad text-white", cta: "bg-bad hover:bg-bad/90" },
  warn: { card: "border-warn/25 bg-warn-soft/70", icon: "bg-warn text-white", cta: "bg-warn hover:bg-warn/90" },
  brand: { card: "border-brand/20 bg-brand-soft/60", icon: "bg-brand text-white", cta: "bg-brand hover:bg-brand-dark" },
  good: { card: "border-good/25 bg-good-soft/70", icon: "bg-good text-white", cta: "bg-good hover:bg-good/90" },
} as const;

/** Everything the importer must do next, most urgent first. */
export function importerActions(bookings: Booking[]): Action[] {
  const actions: Action[] = [];
  for (const booking of bookings) {
    const route = `${bookingPlaces(booking).pickup} → ${bookingPlaces(booking).destination}`;
    const stage = bookingStage(booking);
    const deadline = depositDeadline(booking);
    if (stage === "DEPOSIT_DUE") {
      actions.push({
        key: `${booking.id}-deposit`,
        bookingId: booking.id,
        urgency: 0,
        tone: "bad",
        icon: "card",
        title: "Pay the 50% deposit",
        detail: `The owner accepted ${route}. Pay within the hour or the booking is cancelled and the dates released.`,
        amount: formatRwf(depositAmount(booking)),
        cta: "Pay deposit",
        deadline: deadline ?? undefined,
      });
    }
    for (const impact of openDelayImpacts(booking)) {
      const autoShifted = impact.status === "SHIFTED";
      actions.push({
        key: impact.id,
        bookingId: booking.id,
        urgency: 1,
        tone: autoShifted ? "brand" : "warn",
        icon: "alert",
        title: autoShifted ? "Your dates were shifted automatically" : "A delay affects your booking",
        detail: autoShifted
          ? `The truck's previous trip ran late (${impact.delay.reason}). Your dates have moved by ${impact.shiftDays} day${impact.shiftDays === 1 ? "" : "s"}. Request a full refund any time before your trip starts if the new dates do not work.`
          : `The truck's previous trip runs late (${impact.delay.reason}). Choose to shift your dates by ${impact.shiftDays} day${impact.shiftDays === 1 ? "" : "s"} or cancel for a full refund.`,
        cta: autoShifted ? "Review booking" : "Choose",
      });
    }
    if (stage === "BALANCE_DUE") {
      actions.push({
        key: `${booking.id}-balance`,
        bookingId: booking.id,
        urgency: 2,
        tone: "good",
        icon: "check",
        title: "Cargo delivered: confirm receipt",
        detail: `Confirm you received the cargo on ${route} and pay the remaining 50% to complete the booking.`,
        amount: formatRwf(balanceAmount(booking)),
        cta: "Confirm & pay",
      });
    }
    if (stage === "DOCUMENTS_DUE") {
      const missing = missingDocuments(booking).map((item) => item.label.toLowerCase());
      actions.push({
        key: `${booking.id}-documents`,
        bookingId: booking.id,
        urgency: 3,
        tone: "brand",
        icon: "file",
        title: "Upload your documents",
        detail: `The trip ${route} starts once you upload: ${missing.join(" and ")}.`,
        cta: "Upload",
      });
    }
  }
  return actions.sort((a, b) => a.urgency - b.urgency || (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity));
}

function Countdown({ deadline }: { deadline: Date }) {
  const now = useTicker(1000);
  const left = formatCountdown(deadline, now);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${left ? "bg-white text-bad ring-1 ring-bad/25" : "bg-bad text-white"}`}
      aria-live="polite"
    >
      <Icon name="clock" className="h-3.5 w-3.5" />
      {left ? `${left} left` : "Time is up"}
    </span>
  );
}

export function ActionCenter({ bookings }: { bookings: Booking[] }) {
  const actions = importerActions(bookings);
  return (
    <Panel
      title="Needs your action"
      subtitle={actions.length ? `${actions.length} thing${actions.length === 1 ? "" : "s"} to do, most urgent first.` : "You are all caught up."}
    >
      {actions.length === 0 ? (
        <EmptyNote title="Nothing waiting on you" text="Deposits, documents and receipt confirmations will appear here as soon as they are due." />
      ) : (
        <ul className="stagger grid gap-3 lg:grid-cols-2">
          {actions.map((action) => {
            const tone = TONE[action.tone];
            return (
              <li key={action.key} className={`flex flex-col gap-3 rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-card ${tone.card}`}>
                <div className="flex items-start gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}>
                    <Icon name={action.icon} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-navy">{action.title}</p>
                      {action.deadline ? <Countdown deadline={action.deadline} /> : null}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted">{action.detail}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  {action.amount ? <p className="text-lg font-semibold tabular-nums text-navy">{action.amount}</p> : <span />}
                  <Link
                    href={`/dashboard/importer/bookings/${action.bookingId}`}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-soft transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${tone.cta}`}
                  >
                    {action.cta} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
