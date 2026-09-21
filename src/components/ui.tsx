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
  "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-ink outline-none ring-brand/30 placeholder:text-muted focus:ring-2";

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50 ${className}`}
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
      className={`inline-flex items-center justify-center rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-navy hover:bg-background disabled:opacity-50 ${className}`}
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
    <div className="rounded-2xl border border-line bg-card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl tracking-tight text-navy">
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-brand">{hint}</p> : null}
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
    <div className="rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
      <p className="font-display text-lg text-navy">{title}</p>
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
