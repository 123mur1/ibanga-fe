import type { BookingStatus, TruckStatus } from "@/lib/types";

const bookingStyles: Record<BookingStatus, string> = {
  PENDING: "bg-warn-soft text-warn ring-1 ring-warn/10",
  ACCEPTED: "bg-brand-soft text-brand-dark ring-1 ring-brand/10",
  IN_PROGRESS: "bg-accent text-white ring-1 ring-accent/30",
  DELIVERED: "bg-good-soft text-good ring-1 ring-good/10",
  COMPLETED: "bg-good-soft text-good ring-1 ring-good/10",
  DISPUTED: "bg-bad-soft text-bad ring-1 ring-bad/10",
  REJECTED: "bg-line text-muted ring-1 ring-navy/5",
};

export function BookingBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${bookingStyles[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function TruckBadge({ status }: { status: TruckStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
        status === "AVAILABLE"
          ? "bg-good-soft text-good ring-good/10"
          : "bg-line text-muted ring-navy/5"
      }`}
    >
      {status}
    </span>
  );
}

export function PayNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-brand/15 bg-brand-soft/60 px-4 py-3.5 text-sm text-navy">
      <svg
        className="mt-0.5 shrink-0 text-brand"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4.5" />
        <path d="M12 16h.01" />
      </svg>
      <p>
        Booking a truck holds it immediately (unavailable). Then agree the
        price. If the owner rejects, the truck becomes available again. iBanga
        does not collect the money.
      </p>
    </div>
  );
}
