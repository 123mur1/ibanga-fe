"use client";

import { formatRange } from "@/components/availability-calendar";
import { Field, inputClass } from "@/components/ui";
import { dayCount } from "@/lib/availability";
import { countryOfCity } from "@/lib/locations";
import { CARGO_TYPES, type TripQuote, type Truck } from "@/lib/types";
import { LocationPicker } from "./location-picker";
import { RouteBreakdown } from "./route-breakdown";
import type { WizardForm } from "./state";

type Errors = Partial<Record<string, string>>;
type Update = (patch: Partial<WizardForm>) => void;

function FieldError({ message }: { message?: string }) {
  return message ? <p role="alert" className="mt-1.5 text-sm font-medium text-bad">{message}</p> : null;
}

const pin = (tone: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={tone} aria-hidden="true">
    <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </svg>
);

export function DatesStep({ form, errors, onOpenCalendar }: { form: WizardForm; errors: Errors; onOpenCalendar: () => void }) {
  const days = form.dates ? dayCount(form.dates.start, form.dates.end) : 0;
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onOpenCalendar}
        className={`group flex w-full items-center gap-4 rounded-2xl border-2 border-dashed p-5 text-left transition hover:-translate-y-0.5 hover:border-brand hover:bg-brand-soft/40 ${errors.dates ? "border-bad/40 bg-bad-soft/40" : "border-line bg-background"}`}
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-soft transition group-hover:scale-105">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
            <path d="M3.5 10h17M8 3v4m8-4v4" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block text-lg font-semibold text-navy">{form.dates ? formatRange(form.dates) : "Choose your dates"}</span>
          <span className="block text-sm text-muted">
            {form.dates ? `${days} day${days === 1 ? "" : "s"} from pickup to delivery · tap to change` : "Open the calendar. Booked days are red; every other day is free."}
          </span>
        </span>
      </button>
      <FieldError message={errors.dates} />
      <p className="rounded-xl bg-brand-soft/60 px-4 py-3 text-sm text-navy">
        The truck stays listed for everyone. Only the days you book are blocked on its calendar.
      </p>
    </div>
  );
}

export function RouteStep({
  truck,
  form,
  update,
  errors,
  served,
  quote,
}: {
  truck: Truck;
  form: WizardForm;
  update: Update;
  errors: Errors;
  served: Set<string>;
  quote: { quote: TripQuote | null; loading: boolean; error: string | null };
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-navy px-4 py-3 text-white">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="17" cy="17.5" r="1.6" /></svg>
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/65">Where the truck is now</p>
          <p className="truncate font-semibold">{truck.currentLocation ? `${truck.currentLocation}, ${countryOfCity(truck.currentLocation) || "—"}` : "Not set by the owner"}</p>
        </div>
      </div>
      <p className="text-sm text-muted">
        This truck works in <span className="font-semibold text-navy">{[...served].join(", ")}</span>. Other cities are greyed out.
      </p>
      <LocationPicker legend="Pickup: where the cargo is" icon={pin("text-brand")} value={form.pickup} onChange={(pickup) => update({ pickup })} allowedCities={served} error={errors.pickup} />
      <LocationPicker legend="Final destination of the cargo" icon={pin("text-good")} value={form.destination} onChange={(destination) => update({ destination })} allowedCities={served} error={errors.destination} />
      {errors.quote && !quote.error && !quote.loading ? <FieldError message={errors.quote} /> : null}
      <RouteBreakdown quote={quote.quote} loading={quote.loading} error={quote.error} />
    </div>
  );
}

export function CargoStep({ truck, form, update, errors }: { truck: Truck; form: WizardForm; update: Update; errors: Errors }) {
  const options = truck.acceptedCargo?.length ? truck.acceptedCargo : CARGO_TYPES;
  const weight = Number(form.cargoWeight) || 0;
  const load = Math.min(100, Math.round((weight / truck.capacity) * 100));
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Cargo type">
        <select className={inputClass} value={form.cargoType} onChange={(event) => update({ cargoType: event.target.value })} aria-invalid={Boolean(errors.cargoType)}>
          <option value="">Choose a cargo type</option>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
        {truck.acceptedCargo?.length ? <span className="mt-1.5 block text-xs text-muted">Only the cargo this truck carries is listed.</span> : null}
        <FieldError message={errors.cargoType} />
      </Field>
      <Field label="Weight">
        <div className="relative">
          <input className={`${inputClass} pr-16`} type="number" inputMode="decimal" min="0.1" max={truck.capacity} step="0.1" value={form.cargoWeight} onChange={(event) => update({ cargoWeight: event.target.value })} placeholder="0.0" aria-invalid={Boolean(errors.cargoWeight)} />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">tons</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <div className={`h-full rounded-full transition-all duration-500 ${weight > truck.capacity ? "bg-bad" : "bg-brand"}`} style={{ width: `${weight > truck.capacity ? 100 : load}%` }} />
        </div>
        <span className="mt-1 block text-xs text-muted">{weight ? `${load}% of the ${truck.capacity}-ton limit` : `Limit: ${truck.capacity} tons`}</span>
        <FieldError message={errors.cargoWeight} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Cargo description">
          <textarea className={`${inputClass} min-h-28 resize-y`} value={form.cargoDescription} onChange={(event) => update({ cargoDescription: event.target.value })} placeholder="The goods, packaging, number of pieces and any special handling." aria-invalid={Boolean(errors.cargoDescription)} />
          <FieldError message={errors.cargoDescription} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Instructions for the driver (optional)">
          <textarea className={`${inputClass} min-h-20 resize-y`} value={form.additionalInstructions} onChange={(event) => update({ additionalInstructions: event.target.value })} placeholder="Street address, gate or warehouse number, contact person, loading hours." />
        </Field>
      </div>
    </div>
  );
}
