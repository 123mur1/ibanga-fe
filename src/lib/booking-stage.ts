import { api, apiUrl, readAuthToken } from "./api";
import type { Booking, BookingDocumentKind, TripQuote } from "./types";

/**
 * The booking journey, shared by every screen. The server decides; these helpers only read the
 * booking so that pages agree on what comes next.
 *
 *   PENDING (owner answers, never expires)
 *   → ACCEPTED, deposit due: pay 50% within DEPOSIT_WINDOW_MINUTES or the booking is cancelled
 *   → ACCEPTED, deposit paid: upload cargo and tax documents
 *   → ACCEPTED, documents in: the owner or driver starts the trip
 *   → IN_PROGRESS → DELIVERED: the importer confirms receipt and pays the other 50%
 *   → COMPLETED
 */
export const DEPOSIT_WINDOW_MINUTES = 60;

export const REQUIRED_DOCUMENTS: { kind: Exclude<BookingDocumentKind, "OTHER">; label: string; hint: string }[] = [
  { kind: "CARGO", label: "Cargo documents", hint: "Packing list, commercial invoice, bill of lading or delivery note." },
  { kind: "TAX", label: "Tax and customs documents", hint: "Customs declaration, tax receipt or clearance certificate." },
];

export const DOCUMENT_KIND_LABEL: Record<BookingDocumentKind, string> = {
  CARGO: "Cargo",
  TAX: "Tax / customs",
  OTHER: "Other",
};

export type BookingStage =
  | "REQUESTED"
  | "DEPOSIT_DUE"
  | "DOCUMENTS_DUE"
  | "READY_TO_START"
  | "ON_THE_ROAD"
  | "BALANCE_DUE"
  | "COMPLETED"
  | "DISPUTED"
  | "CLOSED";

export const STAGE_LABEL: Record<BookingStage, string> = {
  REQUESTED: "Waiting for the owner",
  DEPOSIT_DUE: "Pay the 50% deposit",
  DOCUMENTS_DUE: "Upload cargo and tax documents",
  READY_TO_START: "Ready to start",
  ON_THE_ROAD: "On the road",
  BALANCE_DUE: "Confirm receipt and pay the balance",
  COMPLETED: "Completed",
  DISPUTED: "Under review",
  CLOSED: "Closed",
};

/** Ordered steps for progress trackers (CLOSED and DISPUTED are shown separately). */
export const STAGE_ORDER: BookingStage[] = [
  "REQUESTED",
  "DEPOSIT_DUE",
  "DOCUMENTS_DUE",
  "READY_TO_START",
  "ON_THE_ROAD",
  "BALANCE_DUE",
  "COMPLETED",
];

export function totalPrice(booking: Pick<Booking, "agreedPriceRwf">) {
  return booking.agreedPriceRwf ?? 0;
}

/** Half the price, rounded up: the same rule as the server. */
export function depositAmount(booking: Pick<Booking, "agreedPriceRwf" | "payment">) {
  return booking.payment?.depositRwf ?? Math.ceil(totalPrice(booking) / 2);
}

export function balanceAmount(booking: Pick<Booking, "agreedPriceRwf" | "payment">) {
  return totalPrice(booking) - depositAmount(booking);
}

export function depositPaid(booking: Pick<Booking, "payment">) {
  const status = booking.payment?.status;
  return status === "FUNDED" || status === "RELEASED";
}

/** Whether all of the price has been paid (older bookings were paid in one go). */
export function paidInFull(booking: Pick<Booking, "payment">) {
  const payment = booking.payment;
  if (!payment) return false;
  return !payment.depositRwf || Boolean(payment.balancePaidAt);
}

export function missingDocuments(booking: Pick<Booking, "documents">) {
  const kinds = new Set((booking.documents ?? []).map((document) => document.kind));
  return REQUIRED_DOCUMENTS.filter((required) => !kinds.has(required.kind));
}

/** When the deposit window closes, or null when no deposit is due. */
export function depositDeadline(booking: Pick<Booking, "status" | "acceptedAt" | "payment">): Date | null {
  if (booking.status !== "ACCEPTED" || depositPaid(booking) || !booking.acceptedAt) return null;
  return new Date(new Date(booking.acceptedAt).getTime() + DEPOSIT_WINDOW_MINUTES * 60_000);
}

export function bookingStage(booking: Booking): BookingStage {
  switch (booking.status) {
    case "PENDING":
      return "REQUESTED";
    case "ACCEPTED":
      if (!depositPaid(booking)) return "DEPOSIT_DUE";
      return missingDocuments(booking).length ? "DOCUMENTS_DUE" : "READY_TO_START";
    case "IN_PROGRESS":
      return "ON_THE_ROAD";
    case "DELIVERED":
      return "BALANCE_DUE";
    case "COMPLETED":
      return "COMPLETED";
    case "DISPUTED":
      return "DISPUTED";
    default:
      return "CLOSED";
  }
}

/** Delay impacts that still allow the importer to make a decision or request a refund. */
export function openDelayImpacts(booking: Pick<Booking, "delayImpacts" | "status">) {
  if (booking.status !== "PENDING" && booking.status !== "ACCEPTED") return [];
  return (booking.delayImpacts ?? []).filter(
    (impact) => impact.status === "PENDING" || impact.status === "SHIFTED",
  );
}

/** "12:34" left, or null once passed. */
export function formatCountdown(deadline: Date, now: number) {
  const left = deadline.getTime() - now;
  if (left <= 0) return null;
  const minutes = Math.floor(left / 60_000);
  const seconds = Math.floor((left % 60_000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Server price for a trip; throws ApiError with the server's reason (for example an unserved city). */
export function fetchTripQuote(
  truckId: string,
  trip: { pickupCity: string; pickupArea?: string; destinationCity: string; destinationArea?: string },
) {
  const query = new URLSearchParams(
    Object.entries(trip).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
  return api<TripQuote>(`/trucks/${encodeURIComponent(truckId)}/quote?${query}`);
}

/** Link to open an uploaded document. The API needs the login token, so files are fetched as blobs. */
export async function openBookingDocument(bookingId: string, documentId: string) {
  const token = readAuthToken();
  const response = await fetch(
    apiUrl(`/bookings/${encodeURIComponent(bookingId)}/documents/${encodeURIComponent(documentId)}/file`),
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );
  if (!response.ok) throw new Error("Could not open the document.");
  const url = URL.createObjectURL(await response.blob());
  window.open(url, "_blank", "noopener");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
