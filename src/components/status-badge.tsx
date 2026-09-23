import type { BookingStatus, TruckStatus } from "@/lib/types";

const bookingStyles: Record<BookingStatus, { wrap: string; dot: string }> = {
  PENDING: { wrap: "bg-warn-soft text-warn ring-1 ring-warn/10", dot: "bg-warn" },
  ACCEPTED: { wrap: "bg-brand-soft text-brand-dark ring-1 ring-brand/10", dot: "bg-brand" },
  IN_PROGRESS: { wrap: "bg-accent text-white ring-1 ring-accent/30", dot: "bg-white" },
  DELIVERED: { wrap: "bg-good-soft text-good ring-1 ring-good/10", dot: "bg-good" },
  COMPLETED: { wrap: "bg-good-soft text-good ring-1 ring-good/10", dot: "bg-good" },
  DISPUTED: { wrap: "bg-bad-soft text-bad ring-1 ring-bad/10", dot: "bg-bad" },
  REJECTED: { wrap: "bg-line text-muted ring-1 ring-navy/5", dot: "bg-muted" },
};

export function BookingBadge({ status }: { status: BookingStatus }) {
  const style = bookingStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${style.wrap}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status.replace("_", " ")}
    </span>
  );
}

const truckStyles: Record<TruckStatus, { wrap: string; dot: string }> = {
  AVAILABLE: { wrap: "bg-good-soft text-good ring-1 ring-good/10", dot: "bg-good" },
  UNAVAILABLE: { wrap: "bg-line text-muted ring-1 ring-navy/5", dot: "bg-muted" },
};

export function TruckBadge({ status }: { status: TruckStatus }) {
  const style = truckStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${style.wrap}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status === "AVAILABLE" ? "Available" : "Unavailable"}
    </span>
  );
}

export function PayNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-brand/15 bg-gradient-to-r from-brand-soft/80 to-accent-soft/50 px-4 py-3.5 text-sm text-navy">
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