import { formatRange } from "@/components/availability-calendar";
import { TruckThumb } from "@/components/photos";
import { formatPlace } from "@/lib/locations";
import { formatRwf } from "@/lib/payments";
import type { TripQuote, Truck } from "@/lib/types";
import { STEPS, type WizardForm } from "./state";

/** Numbered steps with a progress bar. Completed steps can be revisited by clicking them. */
export function StepIndicator({ current, furthest, onSelect }: { current: number; furthest: number; onSelect: (index: number) => void }) {
  const progress = (current / (STEPS.length - 1)) * 100;
  return (
    <nav aria-label="Booking steps" className="rounded-2xl border border-line bg-card px-4 py-4 shadow-soft sm:px-6">
      <div className="relative">
        <div className="absolute left-4 right-4 top-4 h-1 rounded-full bg-line sm:left-5 sm:right-5" aria-hidden="true">
          <div className="h-full rounded-full bg-brand transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <ol className="relative flex justify-between">
          {STEPS.map((step, index) => {
            const done = index < current;
            const active = index === current;
            const reachable = index <= furthest;
            return (
              <li key={step.id} className="flex flex-col items-center text-center">
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => onSelect(index)}
                  aria-current={active ? "step" : undefined}
                  aria-label={`Step ${index + 1}: ${step.title}`}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 sm:h-10 sm:w-10 ${
                    active ? "scale-110 bg-brand text-white shadow-soft ring-4 ring-brand/20" : done ? "bg-good text-white" : "border-2 border-line bg-card text-muted"
                  } ${reachable && !active ? "hover:scale-105" : ""} disabled:cursor-not-allowed`}
                >
                  {done ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  ) : index + 1}
                </button>
                <span className={`mt-2 text-xs font-semibold sm:text-sm ${active ? "text-navy" : "text-muted"}`}>{step.title}</span>
                <span className="hidden text-xs text-muted md:block">{step.text}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

function SummaryBody({ truck, form, quote }: { truck: Truck; form: WizardForm; quote: TripQuote | null }) {
  const lines: [string, string][] = [
    ["Dates", form.dates ? formatRange(form.dates) : "Not chosen yet"],
    ["Pickup", form.pickup.city ? formatPlace(form.pickup) : "Not chosen yet"],
    ["Destination", form.destination.city ? formatPlace(form.destination) : "Not chosen yet"],
    ["Cargo", form.cargoType ? `${form.cargoType}${form.cargoWeight ? ` · ${form.cargoWeight} t` : ""}` : "Not chosen yet"],
  ];
  return (
    <>
      <div className="flex items-center gap-3">
        <TruckThumb photos={truck.photos} alt={truck.plateNumber} className="h-14 w-14 rounded-xl object-cover" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy">{truck.truckType} · {truck.capacity} t</p>
          <p className="truncate text-sm text-muted">{truck.plateNumber} · {formatRwf(truck.pricePerKmRwf ?? 0)}/km</p>
        </div>
      </div>
      <dl className="mt-4 space-y-2.5 text-sm">
        {lines.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</dt>
            <dd className="text-navy">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 rounded-xl bg-navy px-4 py-3 text-white">
        <p className="text-xs text-white/70">Trip price</p>
        <p key={quote?.priceRwf ?? 0} className="animate-pop-in text-xl font-semibold tabular-nums">{quote ? formatRwf(quote.priceRwf) : "—"}</p>
        {quote ? <p className="text-xs text-white/70">Deposit {formatRwf(quote.depositRwf)} · balance {formatRwf(quote.balanceRwf)}</p> : null}
      </div>
    </>
  );
}

/** Sticky on desktop; a collapsible panel on phones. */
export function BookingSummary(props: { truck: Truck; form: WizardForm; quote: TripQuote | null }) {
  return (
    <>
      <aside aria-label="Booking summary" className="hidden rounded-2xl border border-line bg-card p-5 shadow-soft lg:sticky lg:top-24 lg:block">
        <p className="mb-4 text-sm font-semibold text-brand">Your booking</p>
        <SummaryBody {...props} />
      </aside>
      <details className="group rounded-2xl border border-line bg-card shadow-soft lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-navy">
          <span>Your booking{props.quote ? ` · ${formatRwf(props.quote.priceRwf)}` : ""}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition group-open:rotate-180" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </summary>
        <div className="border-t border-line p-4"><SummaryBody {...props} /></div>
      </details>
    </>
  );
}
