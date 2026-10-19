import Link from "next/link";

/** Card with a header row, used for every detail-page section. */
export function Section({
  title,
  description,
  actions,
  children,
  tone = "default",
  padded = true,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "brand";
  padded?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
      <div className={`flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 ${tone === "brand" ? "bg-brand text-white" : "bg-background/60"}`}>
        <div>
          <h2 className={`font-display text-lg ${tone === "brand" ? "" : "text-navy"}`}>{title}</h2>
          {description ? <p className={`mt-1 text-sm ${tone === "brand" ? "text-white/80" : "text-muted"}`}>{description}</p> : null}
        </div>
        {actions}
      </div>
      <div className={padded ? "px-5 py-5" : ""}>{children}</div>
    </section>
  );
}

export type DetailItem = { label: string; value: React.ReactNode; wide?: boolean };

/** Label/value grid for record details. */
export function DetailList({ items, columns = 2 }: { items: DetailItem[]; columns?: 1 | 2 | 3 }) {
  const cols = columns === 1 ? "" : columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2";
  return (
    <dl className={`grid gap-x-8 gap-y-4 ${cols}`}>
      {items.map((item) => (
        <div key={item.label} className={item.wide ? "sm:col-span-full" : undefined}>
          <dt className="text-sm font-medium text-muted">{item.label}</dt>
          <dd className="mt-0.5 break-words font-semibold text-navy">{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export type TimelineEntry = {
  id: string;
  title: string;
  detail?: string;
  at?: string;
  tone?: "brand" | "success" | "warning" | "danger" | "neutral";
  /** Marks entries entered through demonstration controls. */
  simulated?: boolean;
};

const DOT: Record<NonNullable<TimelineEntry["tone"]>, string> = {
  brand: "bg-brand",
  success: "bg-good",
  warning: "bg-warn",
  danger: "bg-bad",
  neutral: "bg-line",
};

/** Vertical timeline. Pass `at` already formatted. */
export function Timeline({ entries, empty = "Nothing has happened yet." }: { entries: TimelineEntry[]; empty?: string }) {
  if (!entries.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ol className="space-y-4">
      {entries.map((entry, index) => (
        <li key={entry.id} className="relative flex gap-3">
          <span className="relative flex flex-col items-center">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[entry.tone ?? "brand"]}`} />
            {index < entries.length - 1 ? <span className="mt-1 w-px flex-1 bg-line" /> : null}
          </span>
          <div className="min-w-0 pb-1">
            <p className="text-sm font-semibold text-navy">
              {entry.title}
              {entry.simulated ? <span className="ml-2 rounded bg-warn-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-warn">Demo</span> : null}
            </p>
            {entry.detail ? <p className="text-sm text-muted">{entry.detail}</p> : null}
            {entry.at ? <p className="text-xs text-muted">{entry.at}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-dark">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand transition duration-200 group-hover:-translate-x-0.5 group-hover:bg-brand group-hover:text-white">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 4-8 8 8 8" />
        </svg>
      </span>
      {children}
    </Link>
  );
}

/** Row of KPI cards with consistent spacing. */
export function StatGrid({ children, columns = 4 }: { children: React.ReactNode; columns?: 2 | 3 | 4 }) {
  const cols = columns === 2 ? "sm:grid-cols-2" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";
  return <div className={`mt-6 grid gap-4 ${cols}`}>{children}</div>;
}
