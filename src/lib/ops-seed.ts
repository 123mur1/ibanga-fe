import { positionAt } from "./geo";
import type { ActivityEntry, AppNotification, CargoPing, TripNotice } from "./types";

function trail(
  bookingId: string,
  from: string,
  to: string,
  steps: number,
  startIso: string,
): CargoPing[] {
  const start = new Date(startIso).getTime();
  return Array.from({ length: steps }, (_, index) => {
    const km = index * 2;
    const point = positionAt(from, to, km);
    return {
      id: `ping-${bookingId}-${km}`,
      bookingId,
      kmFromStart: km,
      lat: point.lat,
      lng: point.lng,
      label: km === 0 ? from : `${km} km from ${from}`,
      recordedAt: new Date(start + index * 12 * 60 * 1000).toISOString(),
      kind: index === 0 ? "DEPARTURE" : "CHECKPOINT",
    };
  });
}

export const seedPings: CargoPing[] = [
  ...trail("b2", "Musanze", "Kampala", 9, "2026-10-06T06:30:00.000Z"),
  ...trail("b5", "Nairobi", "Kigali", 11, "2026-10-04T07:00:00.000Z"),
];

export const seedNotices: TripNotice[] = [
  {
    id: "notice-b2-depart",
    bookingId: "b2",
    kind: "DEPARTURE",
    at: "2026-10-06T06:30:00.000Z",
    place: "Musanze packing house",
    note: "Loaded and departing on schedule.",
  },
  {
    id: "notice-b2-rest",
    bookingId: "b2",
    kind: "REST",
    at: "2026-10-06T09:15:00.000Z",
    place: "Cyanika road stop",
    note: "Driver rest, 35 minutes.",
  },
  {
    id: "notice-b5-depart",
    bookingId: "b5",
    kind: "DEPARTURE",
    at: "2026-10-04T07:00:00.000Z",
    place: "Nairobi ICD",
    note: "Gate pass checked. Departing.",
  },
];

export const seedNotifications: AppNotification[] = [
  {
    id: "nt-importer-held",
    userId: "u-importer",
    title: "Payment is in escrow",
    body: "Musanze to Kampala is moving. Funds stay in the iBanga account until you confirm receipt.",
    href: "/dashboard/tracking/b2",
    tone: "info",
    read: false,
    createdAt: "2026-10-06T06:40:00.000Z",
  },
  {
    id: "nt-importer-delivered",
    userId: "u-importer-2",
    title: "Cargo marked delivered",
    body: "Nairobi to Kigali is waiting for your receipt confirmation.",
    href: "/dashboard/tracking/b5",
    tone: "warn",
    read: false,
    createdAt: "2026-10-08T15:10:00.000Z",
  },
  {
    id: "nt-owner-request",
    userId: "u-owner",
    title: "New booking paid",
    body: "Kigali dry port to Mombasa is paid and waiting for you to confirm the truck.",
    href: "/dashboard/owner/bookings/b1",
    tone: "warn",
    read: false,
    createdAt: "2026-10-07T08:12:00.000Z",
  },
  {
    id: "nt-admin-dispute",
    userId: "u-admin",
    title: "Open dispute",
    body: "Kigali to Rusumo has a cargo damage report. Escrow is still held.",
    href: "/dashboard/admin/disputes",
    tone: "bad",
    read: false,
    createdAt: "2026-10-07T11:15:00.000Z",
  },
];

export const seedActivity: ActivityEntry[] = [
  {
    id: "act-1",
    actorName: "Jeanine Uwase",
    action: "Paid a booking",
    detail: "Kigali dry port to Mombasa · Visa · awaiting truck confirmation",
    createdAt: "2026-10-07T08:12:00.000Z",
  },
  {
    id: "act-2",
    actorName: "Amina Hassan",
    action: "Confirmed truck availability",
    detail: "Musanze to Kampala funds moved into the iBanga account",
    createdAt: "2026-10-06T05:50:00.000Z",
  },
  {
    id: "act-3",
    actorName: "Amina Hassan",
    action: "Logged a rest stop",
    detail: "Cyanika road stop on Musanze to Kampala",
    createdAt: "2026-10-06T09:15:00.000Z",
  },
  {
    id: "act-4",
    actorName: "David Okello",
    action: "Opened a dispute",
    detail: "Kigali to Rusumo · tiles damaged in transit",
    createdAt: "2026-10-07T11:15:00.000Z",
  },
  {
    id: "act-5",
    actorName: "Eric Ndayisaba",
    action: "Marked cargo delivered",
    detail: "Nairobi to Kigali · payment still held",
    createdAt: "2026-10-08T15:05:00.000Z",
  },
];
