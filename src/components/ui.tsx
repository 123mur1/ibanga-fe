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

const statAccents: Record<
  string,
  { gradient: string; chip: string; icon: string }
> = {
  brand: {
    gradient: "from-brand to-accent",
    chip: "bg-brand-soft text-brand-dark",
    icon: "bg-brand-soft text-brand",
  },
  accent: {
    gradient: "from-accent to-teal-500",
    chip: "bg-accent-soft text-accent-dark",
    icon: "bg-accent-soft text-accent",
  },
  good: {
    gradient: "from-good to-accent",
    chip: "bg-good-soft text-good",
    icon: "bg-good-soft text-good",
  },
  warn: {
    gradient: "from-warn to-brand",
    chip: "bg-warn-soft text-warn",
    icon: "bg-warn-soft text-warn",
  },
  bad: {
    gradient: "from-bad to-warn",
    chip: "bg-bad-soft text-bad",
    icon: "bg-bad-soft text-bad",
  },
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  accent?: "brand" | "accent" | "good" | "warn" | "bad";
}) {
  const tone = statAccents[accent];
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-line bg-card p-4 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-card">
      <span
        className={`absolute inset-x-0 top-0 h-0.5 bg-linear-to-r ${tone.gradient}`}
      />
      <div className="flex items-center gap-3">
        {icon ? (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition duration-200 group-hover:scale-110 group-hover:-rotate-3 [&_svg]:h-4 [&_svg]:w-4 ${tone.icon}`}
          >
            {icon}
          </span>
        ) : null}
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
      </div>
      <p className="mt-2 font-display text-3xl tracking-tight text-navy">
        {value}
      </p>
      {hint ? (
        <p
          className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.chip}`}
        >
          {hint}
        </p>
      ) : null}
    </article>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  icon,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-start gap-4">
        {icon ? (
          <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-brand to-brand-dark text-white shadow-soft [&_svg]:h-4 [&_svg]:w-4 sm:flex">
            {icon}
          </span>
        ) : null}
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-1 font-display text-2xl tracking-tight text-navy">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 max-w-2xl text-sm text-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-3">{actions}</div>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  text,
  icon,
  action,
}: {
  title: string;
  text: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-line bg-card px-6 py-16 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-linear-to-r from-brand/10 via-accent/10 to-transparent blur-2xl"
      />
      <div className="relative">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-brand-soft to-accent-soft text-brand shadow-soft ring-1 ring-brand/10 [&_svg]:h-4.5 [&_svg]:w-4.5">
          {icon ?? (
            <svg
              width="24"
              height="24"
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
          )}
        </div>
        <p className="mt-5 font-display text-xl text-navy">{title}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{text}</p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </div>
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
