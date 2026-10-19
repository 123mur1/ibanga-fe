import { formatRwf } from "./payments";

export { formatRwf };

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormat.format(date);
}

export function formatDateTime(value: string | undefined | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateTimeFormat.format(date);
}

/** "3 hours ago", "in 2 days". */
export function formatRelative(value: string, now: Date = new Date()): string {
  const diff = new Date(value).getTime() - now.getTime();
  const abs = Math.abs(diff);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [86_400_000, "day"],
    [3_600_000, "hour"],
    [60_000, "minute"],
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [size, unit] of units) {
    if (abs >= size) return formatter.format(Math.round(diff / size), unit);
  }
  return "just now";
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function formatTons(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} tons`;
}

export function titleCase(value: string): string {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (char) => char.toUpperCase());
}

/** Compact RWF for charts, e.g. "RWF 1.2M". */
export function formatRwfCompact(amount: number): string {
  return `RWF ${new Intl.NumberFormat("en-RW", { notation: "compact", maximumFractionDigits: 1 }).format(amount)}`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
