import { Notice } from "./notices";

/**
 * Clearly labelled placeholder for a capability that needs a backend or data source that does not
 * exist yet. It never pretends to work: no fake optimisation, GPS or predictions.
 */
export function PlannedFeature({
  title,
  description,
  needs,
  phase = "Planned",
}: {
  title: string;
  description: string;
  /** What must exist before this can be built. */
  needs: string[];
  phase?: string;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-dashed border-line bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg text-navy">{title}</h3>
        <span className="shrink-0 rounded-full bg-line px-2.5 py-0.5 text-xs font-semibold text-muted">{phase}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Needs</p>
      <ul className="mt-1.5 space-y-1 text-sm text-navy">
        {needs.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true" className="text-brand">•</span>
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted">Not available in this build.</p>
    </article>
  );
}

export function PlannedBanner() {
  return (
    <Notice tone="info" title="Planned, not available yet">
      These features are future-ready placeholders. They are kept separate from the core booking and shipment workflows and do not use real optimisation, GPS or prediction.
    </Notice>
  );
}
