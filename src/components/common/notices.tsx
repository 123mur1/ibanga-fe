import Link from "next/link";
import { DEMO_LABEL } from "@/config/env";

const ICONS = {
  info: <path d="M12 8v4.5M12 16h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />,
  warning: <path d="M12 3 2.5 20h19L12 3ZM12 9.5V14M12 17.5h.01" />,
  danger: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 8v4.5M12 16h.01" />,
  success: <path d="M20 6 9 17l-5-5" />,
} as const;

const TONES = {
  info: "border-brand/20 bg-brand-soft/70 text-navy",
  warning: "border-warn/25 bg-warn-soft text-warn",
  danger: "border-bad/25 bg-bad-soft text-bad",
  success: "border-good/25 bg-good-soft text-good",
} as const;

/** Inline message box for warnings, eligibility problems and explanations. */
export function Notice({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: keyof typeof TONES;
  title?: string;
  children?: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div role={tone === "danger" || tone === "warning" ? "alert" : "status"} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${TONES[tone]}`}>
      <svg className="mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {ICONS[tone]}
      </svg>
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={title ? "mt-0.5 leading-6" : "leading-6"}>{children}</div> : null}
      </div>
      {action ? (
        <Link href={action.href} className="shrink-0 font-semibold underline underline-offset-2">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

/** Small chip marking sample data. */
export function DemoTag({ label = DEMO_LABEL }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-warn/30 bg-warn-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-warn">
      {label}
    </span>
  );
}

/**
 * Banner for screens that show simulated money, GPS or verification outcomes. Never remove it from
 * a screen where a user could mistake a simulation for a real payment, location or approval.
 */
export function SimulationNotice({ kind }: { kind: "payment" | "tracking" | "settlement" | "verification" | "general" }) {
  const copy: Record<typeof kind, string> = {
    payment: "Payments on this screen are demonstration data. No card, mobile money or bank was charged and no money moved.",
    tracking: "Positions and milestones are demonstration data entered for this build. They are not live GPS locations of a real vehicle.",
    settlement: "Settlements and payouts are simulations. The real backend must enforce eligibility, idempotency and transaction integrity before any money moves.",
    verification: "Verification outcomes are demonstration data. A real review process and backend checks are required before anyone is treated as verified.",
    general: "Everything here is sample data for demonstration. No real money, vehicles or people are involved.",
  };
  return (
    <Notice tone="warning" title={DEMO_LABEL}>
      {copy[kind]}
    </Notice>
  );
}
