import { formatRwf } from "@/lib/payments";
import type { TripQuote } from "@/lib/types";

const STOP_LABELS = ["Truck is here", "Pickup", "Destination", "Back home"];
const STOP_TONES = ["bg-navy", "bg-brand", "bg-good", "bg-navy"];

/** The priced round trip: truck → pickup → destination → back, with km per leg and the 50/50 split. */
export function RouteBreakdown({ quote, loading, error }: { quote: TripQuote | null; loading: boolean; error: string | null }) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-background px-4 py-4 text-sm text-muted" aria-live="polite">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden="true" />
        Measuring the round trip and pricing it…
      </div>
    );
  }
  if (error) {
    return <p role="alert" className="rounded-xl border border-bad/25 bg-bad-soft px-4 py-3 text-sm text-bad">{error}</p>;
  }
  if (!quote) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-background px-4 py-4 text-sm text-muted">
        Choose the pickup and the destination to see the route and the price.
      </p>
    );
  }

  const stops = [quote.legs[0]?.from, ...quote.legs.map((leg) => leg.to)];
  return (
    <section aria-label="Trip price" className="animate-pop-in overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
      <div className="border-b border-line bg-brand-soft/60 px-4 py-3">
        <p className="text-sm font-semibold text-navy">Round trip the truck drives</p>
        <p className="text-xs text-muted">The truck leaves from where it is now, collects your cargo, delivers it and returns home. Every kilometre is priced.</p>
      </div>
      <ol className="stagger px-4 py-4">
        {stops.map((stop, index) => (
          <li key={`${stop}-${index}`} className="relative flex gap-3 pb-1">
            <div className="flex flex-col items-center">
              <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ring-white ${STOP_TONES[index]}`} aria-hidden="true" />
              {index < stops.length - 1 ? <span className="my-1 w-0.5 flex-1 bg-gradient-to-b from-brand/50 to-brand/10" aria-hidden="true" /> : null}
            </div>
            <div className="min-w-0 flex-1 pb-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{STOP_LABELS[index]}</p>
              <p className="truncate text-sm font-semibold text-navy">{stop}</p>
              {index < quote.legs.length ? (
                <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-muted">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 5v14m-6-6 6 6 6-6" /></svg>
                  {quote.legs[index].km.toLocaleString("en-RW")} km
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <dl className="grid grid-cols-2 gap-px border-t border-line bg-line text-sm">
        <div className="bg-card px-4 py-3">
          <dt className="text-muted">Total distance</dt>
          <dd className="font-semibold tabular-nums text-navy">{quote.km.toLocaleString("en-RW")} km</dd>
        </div>
        <div className="bg-card px-4 py-3">
          <dt className="text-muted">Rate</dt>
          <dd className="font-semibold tabular-nums text-navy">{formatRwf(quote.pricePerKmRwf)} / km</dd>
        </div>
      </dl>
      <div className="bg-navy px-4 py-4 text-white">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-white/75">Trip price</span>
          <span className="text-2xl font-semibold tabular-nums">{formatRwf(quote.priceRwf)}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-white/10 px-3 py-2">
            <p className="text-white/70">50% deposit</p>
            <p className="font-semibold tabular-nums">{formatRwf(quote.depositRwf)}</p>
            <p className="text-xs text-white/60">after the owner accepts</p>
          </div>
          <div className="rounded-lg bg-white/10 px-3 py-2">
            <p className="text-white/70">50% balance</p>
            <p className="font-semibold tabular-nums">{formatRwf(quote.balanceRwf)}</p>
            <p className="text-xs text-white/60">when you receive the cargo</p>
          </div>
        </div>
        {quote.source === "estimate" ? (
          <p className="mt-3 text-xs text-white/60">Distances are estimated from the cities (straight line plus 30% for roads). The server uses the same figures for your booking.</p>
        ) : null}
      </div>
    </section>
  );
}
