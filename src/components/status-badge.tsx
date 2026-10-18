import type { BookingStatus, DisputeStatus, PaymentStatus, RefundStatus, Role, TruckStatus } from "@/lib/types";

const bookingStyles: Record<BookingStatus, { wrap: string; dot: string }> = {
  PENDING: { wrap: "bg-brand-soft text-brand-dark ring-1 ring-brand/10", dot: "bg-brand/40" },
  ACCEPTED: { wrap: "bg-brand-soft text-brand-dark ring-1 ring-brand/10", dot: "bg-brand/70" },
  IN_PROGRESS: { wrap: "bg-brand text-white ring-1 ring-brand/30", dot: "bg-white" },
  DELIVERED: { wrap: "bg-brand/80 text-white ring-1 ring-brand/20", dot: "bg-white" },
  COMPLETED: { wrap: "bg-navy text-white ring-1 ring-navy/20", dot: "bg-white" },
  DISPUTED: { wrap: "bg-brand-dark text-white ring-1 ring-brand-dark/30", dot: "bg-white" },
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
  AVAILABLE: { wrap: "bg-brand-soft text-brand-dark ring-1 ring-brand/10", dot: "bg-brand" },
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

type BadgeStyle = { wrap: string; dot: string };

function Badge({ style, children }: { style: BadgeStyle; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${style.wrap}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {children}
    </span>
  );
}

const paymentStyles: Record<PaymentStatus, BadgeStyle> = {
  PENDING: { wrap: "bg-brand-soft text-brand-dark ring-1 ring-brand/10", dot: "bg-brand/40" },
  AUTHORIZED: { wrap: "bg-brand-soft text-brand-dark ring-1 ring-brand/10", dot: "bg-brand/60" },
  FUNDED: { wrap: "bg-brand-soft text-brand-dark ring-1 ring-brand/10", dot: "bg-brand/80" },
  HELD: { wrap: "bg-brand text-white ring-1 ring-brand/30", dot: "bg-white" },
  RELEASED: { wrap: "bg-navy text-white ring-1 ring-navy/20", dot: "bg-white" },
  REFUNDED: { wrap: "bg-line text-muted ring-1 ring-navy/5", dot: "bg-muted" },
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge style={paymentStyles[status]}>{status.replaceAll("_", " ")}</Badge>;
}

const disputeStyles: Record<DisputeStatus, BadgeStyle> = {
  OPEN: { wrap: "bg-brand-soft text-brand-dark ring-1 ring-brand/10", dot: "bg-brand" },
  RESOLVED: { wrap: "bg-navy text-white ring-1 ring-navy/20", dot: "bg-white" },
};

export function DisputeBadge({ status, label }: { status: DisputeStatus; label?: string }) {
  return <Badge style={disputeStyles[status]}>{label ?? status.replaceAll("_", " ")}</Badge>;
}

const refundStyles: Record<RefundStatus, BadgeStyle> = {
  REQUESTED: { wrap: "bg-brand-soft text-brand-dark ring-1 ring-brand/10", dot: "bg-brand" },
  APPROVED: { wrap: "bg-navy text-white ring-1 ring-navy/20", dot: "bg-white" },
  REJECTED: { wrap: "bg-line text-muted ring-1 ring-navy/5", dot: "bg-muted" },
};

export function RefundBadge({ status }: { status: RefundStatus }) {
  return <Badge style={refundStyles[status]}>{status === "REQUESTED" ? "Pending review" : status}</Badge>;
}

const roleStyles: Record<Role, BadgeStyle> = {
  IMPORTER: { wrap: "bg-brand-soft text-brand-dark ring-1 ring-brand/10", dot: "bg-brand" },
  TRUCK_OWNER: { wrap: "bg-navy text-white ring-1 ring-navy/20", dot: "bg-white" },
  ADMIN: { wrap: "bg-brand text-white ring-1 ring-brand/30", dot: "bg-white" },
};

export function RoleBadge({ role }: { role: Role }) {
  return <Badge style={roleStyles[role]}>{role.replaceAll("_", " ")}</Badge>;
}

export function PayNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-brand/15 bg-gradient-to-r from-brand-soft/80 to-brand-soft/30 px-4 py-3.5 text-sm text-navy">
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
        You pay by Visa, Airtel Money, or MTN MoMo when you book. After the owner
        confirms the truck, iBanga holds the money until the owner confirms delivery
        and you confirm receipt. Otherwise it is refunded.
      </p>
    </div>
  );
}