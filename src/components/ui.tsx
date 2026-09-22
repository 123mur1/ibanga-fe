export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-navy">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-ink shadow-soft outline-none ring-brand/20 placeholder:text-muted/70 transition hover:border-navy/20 focus:border-brand/50 focus:ring-2";

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-card disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-soft ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-soft transition hover:-translate-y-0.5 hover:border-navy/20 hover:bg-background disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-soft ${className}`}
    >
      {children}
    </button>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-card p-5 shadow-soft">
      <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand to-accent" />
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-4xl tracking-tight text-navy">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 inline-flex rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-dark">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-card/60 px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-9-9" />
          <path d="M12 7v5l3 3" />
        </svg>
      </div>
      <p className="mt-4 font-display text-lg text-navy">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{text}</p>
    </div>
  );
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
