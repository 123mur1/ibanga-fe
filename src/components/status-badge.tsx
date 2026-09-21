import type { BookingStatus, TruckStatus } from "@/lib/types";

const bookingStyles: Record<BookingStatus, string> = {
  PENDING: "bg-warn-soft text-warn",
  ACCEPTED: "bg-brand-soft text-brand-dark",
  IN_PROGRESS: "bg-accent text-white",
  DELIVERED: "bg-good-soft text-good",
  COMPLETED: "bg-good-soft text-good",
  DISPUTED: "bg-bad-soft text-bad",
  REJECTED: "bg-line text-muted",
};

export function BookingBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${bookingStyles[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function TruckBadge({ status }: { status: TruckStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        status === "AVAILABLE"
          ? "bg-good-soft text-good"
          : "bg-line text-muted"
      }`}
    >
      {status}
    </span>
  );
}

export function PayNotice() {
  return (
    <p className="rounded-xl border border-brand-soft bg-brand-soft/60 px-4 py-3 text-sm text-navy">
      Booking a truck holds it immediately (unavailable). Then agree the price.
      If the owner rejects, the truck becomes available again. iBanga does not
      collect the money.
    </p>
  );
}
