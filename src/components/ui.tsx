"use client";

import { useMemo, useState } from "react";

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
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-soft ${className}`}
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-soft transition hover:-translate-y-0.5 hover:border-navy/20 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-soft ${className}`}
    >
      {children}
    </button>
  );
}

export type DataTableRow = {
  id: string;
  cells: React.ReactNode[];
  searchText: string;
  filterValue?: string;
  exportValues: string[];
};

export function DataTable({
  columns,
  rows,
  emptyMessage = "There are no records to display.",
  filterLabel = "All statuses",
}: {
  columns: { label: string; className?: string }[];
  rows: DataTableRow[];
  emptyMessage?: string;
  filterLabel?: string;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const filterOptions = useMemo(
    () => [...new Set(rows.map((row) => row.filterValue).filter((value): value is string => Boolean(value)))].sort(),
    [rows],
  );
  const visibleRows = useMemo(() => rows.filter((row) =>
    row.searchText.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
    && (!filter || row.filterValue === filter),
  ), [filter, rows, search]);
  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((row) => selected.has(row.id));

  const exportRows = (data: DataTableRow[]) => {
    const escape = (value: string) => {
      const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
      return `"${safeValue.replaceAll('"', '""')}"`;
    };
    const csv = [
      columns.map((column) => escape(column.label)).join(","),
      ...data.map((row) => row.exportValues.map(escape).join(",")),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ibanga-export.csv";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search records..."
            aria-label="Search records"
            className="w-full rounded-lg border border-line px-3 py-2 text-sm text-navy outline-none focus:border-brand sm:max-w-sm"
          />
          {filterOptions.length > 0 ? (
            <select aria-label={filterLabel} value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy outline-none focus:border-brand">
              <option value="">{filterLabel}</option>
              {filterOptions.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
            </select>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-muted">{selected.size} selected</span>
          <button type="button" disabled={!selected.size} onClick={() => exportRows(rows.filter((row) => selected.has(row.id)))} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-navy transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-50">Export selected</button>
          <button type="button" onClick={() => exportRows(rows)} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark">Export all</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-background text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="w-12 px-4 py-3.5">
                <input
                  type="checkbox"
                  aria-label="Select all visible rows"
                  checked={allVisibleSelected}
                  onChange={() => setSelected((current) => {
                    const next = new Set(current);
                    visibleRows.forEach((row) => allVisibleSelected ? next.delete(row.id) : next.add(row.id));
                    return next;
                  })}
                  className="accent-brand"
                />
              </th>
              {columns.map((column) => (
                <th key={column.label} scope="col" className={`px-5 py-3.5 font-semibold ${column.className ?? ""}`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visibleRows.map((row) => (
              <tr key={row.id} className={`transition hover:bg-background/70 ${selected.has(row.id) ? "bg-brand-soft/40" : ""}`}>
                <td className="px-4 py-4">
                  <input type="checkbox" aria-label={`Select row ${row.id}`} checked={selected.has(row.id)} onChange={() => setSelected((current) => {
                    const next = new Set(current);
                    if (next.has(row.id)) next.delete(row.id);
                    else next.add(row.id);
                    return next;
                  })} className="accent-brand" />
                </td>
                {row.cells.map((cell, cellIndex) => (
                  <td key={`${row.id}-${cellIndex}`} className={`px-5 py-4 text-navy ${columns[cellIndex]?.className ?? ""}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visibleRows.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted">{emptyMessage}</p>
      ) : null}
    </div>
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

export function DashboardWelcomeCard({
  title,
  description,
  actions,
  metric,
  metricLabel,
  metricIcon,
}: {
  title: string;
  description: string;
  actions: React.ReactNode;
  metric?: string;
  metricLabel?: string;
  metricIcon?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand to-brand-dark p-5 text-white shadow-card sm:p-6">
      <div className="paper-grid absolute inset-0 opacity-20" />
      <div aria-hidden="true" className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-24 border-white/10" />
      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Workspace</p>
          <h1 className="mt-2 font-display text-2xl leading-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">{description}</p>
          <div className="mt-4 flex flex-wrap gap-3">{actions}</div>
        </div>
        {metric !== undefined && metricLabel ? (
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/20 backdrop-blur-sm">
            {metricIcon ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white [&_svg]:h-5 [&_svg]:w-5">
                {metricIcon}
              </span>
            ) : null}
            <div>
              <p className="font-display text-2xl leading-none">{metric}</p>
              <p className="mt-1 text-xs text-white/70">{metricLabel}</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
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
