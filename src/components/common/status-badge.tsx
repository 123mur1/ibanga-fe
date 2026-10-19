import { STATUS_DEFS, statusOf, TONE_CLASSES, type StatusFamily, type StatusTone } from "@/config/status";

/**
 * The one badge used for every status in the app. Labels and colours come from
 * `@/config/status`, so a state always looks the same on every screen.
 */
export function StatusBadge({
  family,
  status,
  label,
  tone,
}: {
  family: StatusFamily;
  status: string;
  /** Overrides the default label (for example "Open case"). */
  label?: string;
  /** Overrides the default tone. */
  tone?: StatusTone;
}) {
  const def = statusOf(family, status);
  const classes = TONE_CLASSES[tone ?? def.tone];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${classes.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${classes.dot}`} aria-hidden="true" />
      {label ?? def.label}
    </span>
  );
}

/** Dropdown options for a status family, e.g. for filters. */
export function statusOptions(family: StatusFamily): { value: string; label: string }[] {
  return Object.entries(STATUS_DEFS[family]).map(([value, def]) => ({ value, label: def.label }));
}
