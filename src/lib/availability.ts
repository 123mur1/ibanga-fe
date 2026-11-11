import { ACTIVE_BOOKING_STATUSES, type BookedRange, type Booking } from "./types";

/**
 * Vehicle availability by calendar day. A vehicle stays listed whatever its bookings: it is only
 * unavailable on the days a live booking covers, so others can book it on different dates.
 * Days are local "YYYY-MM-DD" keys, which compare correctly as plain strings.
 */

export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Inclusive number of days from `start` to `end`. */
export function dayCount(start: string, end: string): number {
  return Math.round((parseDateKey(end).getTime() - parseDateKey(start).getTime()) / 86_400_000) + 1;
}

/** The date part of an ISO timestamp or date, as a local day key. */
function dayOf(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : toDateKey(new Date(value));
}

/** Days taken by the live bookings of one vehicle, earliest first. */
export function bookedRangesFromBookings(truckId: string, bookings: Booking[]): BookedRange[] {
  return bookings
    .filter((booking) => booking.truckId === truckId && ACTIVE_BOOKING_STATUSES.includes(booking.status) && booking.pickupDate)
    .map((booking) => {
      const start = dayOf(booking.pickupDate);
      const end = booking.expectedDeliveryDate ? dayOf(booking.expectedDeliveryDate) : start;
      return { start, end: end < start ? start : end };
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function isDayBooked(key: string, ranges: BookedRange[] = []): boolean {
  return ranges.some((range) => key >= range.start && key <= range.end);
}

/** Whether no booked day falls between `start` and `end` (inclusive). */
export function isRangeFree(start: string, end: string, ranges: BookedRange[] = []): boolean {
  return !ranges.some((range) => range.start <= end && range.end >= start);
}

/** The first day from `from` onwards that no booking covers. */
export function nextFreeDay(ranges: BookedRange[] = [], from = todayKey()): string {
  let day = from;
  for (let guard = 0; guard < 730 && isDayBooked(day, ranges); guard += 1) day = addDays(day, 1);
  return day;
}

export function formatDay(key: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  return parseDateKey(key).toLocaleDateString("en-GB", options);
}
