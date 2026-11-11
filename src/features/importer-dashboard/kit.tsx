"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { bookingStage, STAGE_LABEL, STAGE_ORDER } from "@/lib/booking-stage";
import { bookingPlaces } from "@/lib/locations";
import type { Booking } from "@/lib/types";

/**
 * Building blocks shared by the importer, truck owner and driver home pages: a gradient hero,
 * titled panels, number tiles, a route line and a stage tracker. No charts (importer and owner
 * pages use cards, numbers and lists only).
 */

/** The current time, ticking every `intervalMs` (state is set in the timer callback). */
export function useTicker(intervalMs = 1000, active = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, active]);
  return now;
}

export function Hero({
  eyebrow,
  title,
  subtitle,
  actions,
  aside,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-brand-dark to-navy p-6 text-white shadow-card sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-accent/30 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{eyebrow}</p>
          <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-white/80 sm:text-base">{subtitle}</p>
          {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {aside ? <div className="relative animate-pop-in">{aside}</div> : null}
      </div>
    </section>
  );
}

export function HeroLink({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          : "inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      }
    >
      {children}
    </Link>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-navy">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-semibold text-brand transition hover:text-brand-dark">
      {children} <span aria-hidden="true">→</span>
    </Link>
  );
}

const TILE_TONES = {
  brand: "bg-brand-soft text-brand",
  accent: "bg-accent-soft text-accent",
  good: "bg-good-soft text-good",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
} as const;

export function NumberTile({
  label,
  value,
  hint,
  tone = "brand",
  icon,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: keyof typeof TILE_TONES;
  icon: React.ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl [&_svg]:h-5 [&_svg]:w-5 ${TILE_TONES[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-0.5 truncate text-xl font-semibold tabular-nums text-navy sm:text-2xl">{value}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      </div>
    </>
  );
  const className =
    "flex items-start gap-3 rounded-2xl border border-line bg-card p-4 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-card";
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** Pickup → destination with full addresses (area, city, country). */
export function RouteLine({ booking, compact = false }: { booking: Booking; compact?: boolean }) {
  const places = bookingPlaces(booking);
  return (
    <div className={`flex items-stretch gap-3 ${compact ? "text-sm" : ""}`}>
      <div className="flex flex-col items-center pt-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full border-2 border-brand bg-white" />
        <span className="my-1 w-px flex-1 border-l-2 border-dashed border-brand/30" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand" />
      </div>
      <div className="min-w-0 space-y-2">
        <p className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Pickup</span>
          <span className="block truncate font-semibold text-navy">{places.pickup}</span>
        </p>
        <p className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Destination</span>
          <span className="block truncate font-semibold text-navy">{places.destination}</span>
        </p>
      </div>
    </div>
  );
}

/** Dots for each step of the booking journey, the current one highlighted. */
export function StageProgress({ booking }: { booking: Booking }) {
  const stage = bookingStage(booking);
  const index = STAGE_ORDER.indexOf(stage);
  if (index < 0) {
    return <p className="text-xs font-semibold text-muted">{STAGE_LABEL[stage]}</p>;
  }
  return (
    <div>
      <div className="flex items-center gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={STAGE_ORDER.length} aria-valuenow={index + 1} aria-label={`Step ${index + 1} of ${STAGE_ORDER.length}: ${STAGE_LABEL[stage]}`}>
        {STAGE_ORDER.map((step, position) => (
          <span
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${position < index ? "bg-brand" : position === index ? "bg-accent" : "bg-line"}`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs font-semibold text-brand-dark">
        Step {index + 1} of {STAGE_ORDER.length} · {STAGE_LABEL[stage]}
      </p>
    </div>
  );
}

export function EmptyNote({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-background/60 px-5 py-8 text-center">
      <p className="font-semibold text-navy">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

const ICON_PATHS = {
  truck: "M3 6h11v10H3zM14 10h4l3 3v3h-7zM7.5 19.3a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6ZM17.5 19.3a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z",
  route: "M6 21.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM18 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM8.5 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5",
  check: "M20 6 9 17l-5-5",
  wallet: "M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2ZM16 14h.01",
  card: "M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  file: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5",
  alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  inbox: "M3 13h5l1.5 2.5h5L16 13h5M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  pin: "M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11ZM12 12.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z",
  calendar: "M4 5h16v16H4zM4 9h16M8 3v4M16 3v4",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  steering: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM3.5 10.5 10 12M14 12l6.5-1.5M12 14v7",
} as const;

export function Icon({ name, className = "h-5 w-5" }: { name: keyof typeof ICON_PATHS; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
