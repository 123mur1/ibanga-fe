"use client";

import { useEffect, useMemo, useState } from "react";
import { downloadExcel } from "@/lib/excel";

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
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-base text-ink outline-none ring-brand/15 placeholder:text-muted/80 transition hover:border-brand/30 focus:border-brand focus:ring-2";

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 ${className}`}
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-brand/40 hover:bg-brand-soft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 ${className}`}
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
  extraFilterValue?: string;
  exportValues: string[];
};

export function DataTable({
  columns,
  rows,
  emptyMessage = "There are no records to display.",
  filterLabel = "All statuses",
  extraFilterLabel = "All types",
  exportName = "ibanga-export",
}: {
  columns: { label: string; className?: string }[];
  rows: DataTableRow[];
  emptyMessage?: string;
  filterLabel?: string;
  extraFilterLabel?: string;
  exportName?: string;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [extraFilter, setExtraFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const filterOptions = useMemo(
    () => [...new Set(rows.map((row) => row.filterValue).filter((value): value is string => Boolean(value)))].sort(),
    [rows],
  );
  const extraOptions = useMemo(
    () => [...new Set(rows.map((row) => row.extraFilterValue).filter((value): value is string => Boolean(value)))].sort(),
    [rows],
  );
  const visibleRows = useMemo(() => rows.filter((row) =>
    row.searchText.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
    && (!filter || row.filterValue === filter)
    && (!extraFilter || row.extraFilterValue === extraFilter),
  ), [extraFilter, filter, rows, search]);
  const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = visibleRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allVisibleSelected = pageRows.length > 0 && pageRows.every((row) => selected.has(row.id));

  useEffect(() => {
    setPage(1);
  }, [search, filter, extraFilter, pageSize]);

  const exportRows = (data: DataTableRow[]) => {
    downloadExcel(
      exportName,
      columns.map((column) => column.label),
      data.map((row) => row.exportValues),
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
      <div className="flex flex-col gap-3 border-b border-line bg-background/60 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search records"
            aria-label="Search records"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy outline-none focus:border-brand sm:max-w-xs"
          />
          {filterOptions.length > 0 ? (
            <select aria-label={filterLabel} value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy outline-none focus:border-brand">
              <option value="">{filterLabel}</option>
              {filterOptions.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
            </select>
          ) : null}
          {extraOptions.length > 0 ? (
            <select aria-label={extraFilterLabel} value={extraFilter} onChange={(event) => setExtraFilter(event.target.value)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy outline-none focus:border-brand">
              <option value="">{extraFilterLabel}</option>
              {extraOptions.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
            </select>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-muted">{selected.size} selected</span>
          <button type="button" disabled={!selected.size} onClick={() => exportRows(rows.filter((row) => selected.has(row.id)))} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-navy transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-50">Export selected</button>
          <button type="button" onClick={() => exportRows(visibleRows)} className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark">Export Excel</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="border-b border-line bg-white text-sm text-muted">
            <tr>
              <th scope="col" className="w-12 px-4 py-3.5">
                <input
                  type="checkbox"
                  aria-label="Select all visible rows"
                  checked={allVisibleSelected}
                  onChange={() => setSelected((current) => {
                    const next = new Set(current);
                    pageRows.forEach((row) => allVisibleSelected ? next.delete(row.id) : next.add(row.id));
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
            {pageRows.map((row) => (
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
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-muted">
          <p>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, visibleRows.length)} of {visibleRows.length}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2">
              Rows
              <select aria-label="Rows per page" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="rounded-lg border border-line bg-white px-2 py-1 text-navy">
                {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-line px-3 py-1.5 font-semibold text-navy disabled:opacity-40">Previous</button>
            <span className="tabular-nums">{currentPage} / {pageCount}</span>
            <button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-lg border border-line px-3 py-1.5 font-semibold text-navy disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

const statAccents: Record<
  string,
  { bar: string; chip: string; icon: string }
> = {
  brand: {
    bar: "bg-brand",
    chip: "bg-brand-soft text-brand-dark",
    icon: "bg-brand-soft text-brand",
  },
  accent: {
    bar: "bg-accent",
    chip: "bg-accent-soft text-accent-dark",
    icon: "bg-accent-soft text-accent",
  },
  good: {
    bar: "bg-good",
    chip: "bg-good-soft text-good",
    icon: "bg-good-soft text-good",
  },
  warn: {
    bar: "bg-warn",
    chip: "bg-warn-soft text-warn",
    icon: "bg-warn-soft text-warn",
  },
  bad: {
    bar: "bg-bad",
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
    <article className="flex min-h-[132px] flex-col rounded-xl border border-line bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        {icon ? (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg [&_svg]:h-4 [&_svg]:w-4 ${tone.icon}`}>
            {icon}
          </span>
        ) : (
          <span className={`h-2 w-2 rounded-full ${tone.bar}`} />
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-navy tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className={`mt-auto pt-3 text-sm font-medium ${tone.chip} w-fit rounded-md px-2 py-0.5`}>
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
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white [&_svg]:h-5 [&_svg]:w-5 sm:flex">
            {icon}
          </span>
        ) : null}
        <div>
          {eyebrow ? (
            <p className="text-sm font-semibold text-brand">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 max-w-2xl text-base text-muted">{subtitle}</p>
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
}: {
  title: string;
  description: string;
  actions: React.ReactNode;
  metric?: string;
  metricLabel?: string;
  metricIcon?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-brand px-5 py-5 text-white sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-white/75">Workspace</p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-xl text-base leading-6 text-white/85">{description}</p>
          <div className="mt-4 flex flex-wrap gap-3">{actions}</div>
        </div>
        {metric !== undefined && metricLabel ? (
          <div className="min-w-40 rounded-lg bg-white/15 px-4 py-3 ring-1 ring-white/25">
            <p className="text-2xl font-semibold leading-none tabular-nums">{metric}</p>
            <p className="mt-1 text-sm text-white/75">{metricLabel}</p>
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
