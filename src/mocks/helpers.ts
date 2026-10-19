/**
 * Helpers for building demonstration data. Dates are relative to "today" so expiry warnings and
 * "recent activity" always look current. Everything produced here is SAMPLE DATA.
 */
const base = new Date();
base.setUTCHours(0, 0, 0, 0);

/** ISO timestamp `dayOffset` days from today at the given UTC time. */
export function at(dayOffset: number, hour = 9, minute = 0): string {
  return new Date(base.getTime() + dayOffset * 86_400_000 + (hour * 60 + minute) * 60_000).toISOString();
}

/** Calendar date (YYYY-MM-DD) `dayOffset` days from today. */
export function day(dayOffset: number): string {
  return at(dayOffset).slice(0, 10);
}

/** Stable reference number such as "CR-2026-0012". */
export function ref(prefix: string, serial: number): string {
  return `${prefix}-${new Date(base).getUTCFullYear()}-${String(serial).padStart(4, "0")}`;
}

/** An SVG data URL showing a clearly labelled sample document or photo (no real file involved). */
export function sampleFile(title: string, subtitle = "Sample file for demonstration only"): string {
  const safe = (value: string) => value.replace(/[<>&"]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="440" viewBox="0 0 640 440"><rect width="640" height="440" fill="#eef2f5"/><rect x="24" y="24" width="592" height="392" rx="14" fill="#fff" stroke="#d5e0e7" stroke-width="2"/><rect x="48" y="52" width="120" height="14" rx="7" fill="#00628b"/><text x="48" y="130" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#122832">${safe(title)}</text><text x="48" y="164" font-family="Arial, sans-serif" font-size="16" fill="#4d6470">${safe(subtitle)}</text><g fill="#d5e0e7"><rect x="48" y="210" width="544" height="10" rx="5"/><rect x="48" y="240" width="480" height="10" rx="5"/><rect x="48" y="270" width="510" height="10" rx="5"/><rect x="48" y="300" width="360" height="10" rx="5"/></g><text x="48" y="380" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#b45309">SAMPLE - NOT A REAL DOCUMENT</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
