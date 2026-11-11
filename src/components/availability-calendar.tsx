"use client";

import { useState } from "react";
import { GhostButton, Modal, PrimaryButton } from "@/components/ui";
import { dayCount, formatDay, isDayBooked, isRangeFree, parseDateKey, toDateKey, todayKey } from "@/lib/availability";
import type { BookedRange } from "@/lib/types";

export type DateRange = { start: string; end: string };

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/** Day keys for a month grid, Monday first, padded with nulls before the 1st. */
function monthCells(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, index) => toDateKey(new Date(year, month, index + 1))),
  ];
}

function Month({
  year,
  month,
  booked,
  start,
  end,
  hover,
  onPick,
  onHover,
}: {
  year: number;
  month: number;
  booked: BookedRange[];
  start: string | null;
  end: string | null;
  hover: string | null;
  onPick: (key: string) => void;
  onHover: (key: string | null) => void;
}) {
  const today = todayKey();
  // While choosing the end date, preview the span up to the day under the pointer.
  const previewEnd = start && !end && hover && hover >= start ? hover : end;
  const label = new Date(year, month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="min-w-0">
      <p className="mb-3 text-center text-sm font-semibold text-navy">{label}</p>
      <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label={label}>
        {WEEKDAYS.map((day) => (
          <span key={day} className="pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted" aria-hidden="true">{day}</span>
        ))}
        {monthCells(year, month).map((key, index) => {
          if (!key) return <span key={`pad-${index}`} aria-hidden="true" />;
          const past = key < today;
          const taken = isDayBooked(key, booked);
          const disabled = past || taken;
          const isEdge = key === start || key === (previewEnd ?? start);
          const inRange = Boolean(start && previewEnd && key > start && key < previewEnd);
          const day = parseDateKey(key).getDate();
          const tone = taken
            ? "bg-bad-soft text-bad line-through decoration-bad/60 cursor-not-allowed ring-1 ring-bad/20"
            : past
              ? "text-muted/40 cursor-not-allowed"
              : isEdge
                ? "bg-brand text-white font-semibold shadow-soft"
                : inRange
                  ? "bg-brand-soft text-brand-dark"
                  : "text-navy hover:bg-brand-soft hover:text-brand-dark";
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              aria-pressed={isEdge || inRange}
              aria-label={`${formatDay(key, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${taken ? ", booked" : past ? ", past" : ""}`}
              onClick={() => onPick(key)}
              onMouseEnter={() => onHover(key)}
              onMouseLeave={() => onHover(null)}
              className={`flex aspect-square items-center justify-center rounded-lg text-sm tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${tone}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Popup calendar of a vehicle's availability. Booked days are red and cannot be chosen; the
 * importer picks a start and an end day (the same day for a one-day trip) and continues.
 */
export function AvailabilityDialog({
  title = "Check availability",
  vehicleLabel,
  booked,
  initial,
  continueLabel = "Continue",
  onClose,
  onContinue,
}: {
  title?: string;
  vehicleLabel: string;
  booked: BookedRange[];
  initial?: DateRange | null;
  continueLabel?: string;
  onClose: () => void;
  onContinue: (range: DateRange) => void;
}) {
  const today = parseDateKey(todayKey());
  const firstShown = initial ? parseDateKey(initial.start) : today;
  const [view, setView] = useState({ year: firstShown.getFullYear(), month: firstShown.getMonth() });
  const [start, setStart] = useState<string | null>(initial?.start ?? null);
  const [end, setEnd] = useState<string | null>(initial?.end ?? null);
  const [hover, setHover] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const next = view.month === 11 ? { year: view.year + 1, month: 0 } : { year: view.year, month: view.month + 1 };
  const atFirstMonth = view.year === today.getFullYear() && view.month === today.getMonth();

  function shift(months: number) {
    const date = new Date(view.year, view.month + months, 1);
    setView({ year: date.getFullYear(), month: date.getMonth() });
  }

  function pick(key: string) {
    setError(null);
    // First click, or a new start after a full range or before the current start.
    if (!start || end || key < start) {
      setStart(key);
      setEnd(null);
      return;
    }
    if (!isRangeFree(start, key, booked)) {
      setError("Those dates include days that are already booked. Choose dates without red days.");
      return;
    }
    setEnd(key);
  }

  const chosenEnd = end ?? start;
  const summary = start && chosenEnd
    ? `${formatDay(start, { weekday: "short", day: "numeric", month: "short" })} → ${formatDay(chosenEnd, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · ${dayCount(start, chosenEnd)} day${dayCount(start, chosenEnd) === 1 ? "" : "s"}`
    : null;

  return (
    <Modal
      wide
      title={title}
      description={vehicleLabel}
      onClose={onClose}
      footer={
        <>
          <GhostButton type="button" onClick={onClose}>Close</GhostButton>
          <PrimaryButton
            type="button"
            disabled={!start}
            onClick={() => start && onContinue({ start, end: chosenEnd ?? start })}
          >
            {continueLabel}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            disabled={atFirstMonth}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-navy transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <p className="text-sm text-muted">{start && !end ? "Now choose the last day" : "Choose the first day"}</p>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-navy transition hover:border-brand hover:text-brand"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Month {...view} booked={booked} start={start} end={end} hover={hover} onPick={pick} onHover={setHover} />
          <div className="hidden sm:block">
            <Month {...next} booked={booked} start={start} end={end} hover={hover} onPick={pick} onHover={setHover} />
          </div>
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-xs text-muted">
          <li className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-bad-soft ring-1 ring-bad/30" aria-hidden="true" />Booked</li>
          <li className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-brand" aria-hidden="true" />Your dates</li>
          <li className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded border border-line bg-white" aria-hidden="true" />Available</li>
        </ul>

        {error ? <p role="alert" className="rounded-lg border border-bad/20 bg-bad-soft px-3.5 py-2.5 text-sm font-medium text-bad">{error}</p> : null}
        <p aria-live="polite" className="rounded-xl bg-background px-4 py-3 text-sm font-semibold text-navy">
          {summary ?? "No dates chosen yet."}
          {start && !end ? <span className="ml-1 font-normal text-muted">Choose the same day again for a one-day trip, or continue.</span> : null}
        </p>
      </div>
    </Modal>
  );
}

/** "12 Nov → 15 Nov 2026" for a chosen range. */
export function formatRange(range: DateRange): string {
  return range.start === range.end
    ? formatDay(range.start)
    : `${formatDay(range.start, { day: "numeric", month: "short" })} → ${formatDay(range.end)}`;
}
