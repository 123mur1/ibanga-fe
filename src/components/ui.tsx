"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { downloadExcel } from "@/lib/excel";

export function Field({
  label,
  required = false,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-navy">{label}{required ? <span className="ml-0.5 text-bad" aria-hidden="true">*</span> : null}</span>
      {children}
      {hint && !error ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
      {error ? <span role="alert" className="mt-1 block text-xs font-medium text-bad">{error}</span> : null}
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

export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8 sm:items-center">
      <div className="fixed inset-0 bg-navy/45 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-fade-in relative w-full ${wide ? "max-w-2xl" : "max-w-lg"} overflow-hidden rounded-2xl border border-line bg-white shadow-card`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line bg-brand px-5 py-4 text-white sm:px-6">
          <div>
            <h2 className="font-display text-xl font-semibold">{title}</h2>
            {description ? <p className="mt-1 text-sm text-white/80">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white transition hover:bg-white/25"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-3 border-t border-line bg-background/60 px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ViewLink({ href, label = "View details" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-brand transition hover:border-brand hover:bg-brand hover:text-white"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </Link>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "brand",
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "brand" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <GhostButton type="button" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </GhostButton>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${
              tone === "danger" ? "bg-navy hover:bg-navy/90" : "bg-brand hover:bg-brand-dark"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <p className="whitespace-pre-line text-sm leading-6 text-navy">{message}</p>
    </Modal>
  );
}

export type RowAction = {
  label: string;
  onSelect: () => void | Promise<void>;
  tone?: "default" | "danger";
  disabled?: boolean;
  confirm?: {
    title: string;
    message: string;
    confirmLabel?: string;
    tone?: "brand" | "danger";
  };
};

export function RowActions({ actions, label = "More actions" }: { actions: RowAction[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const [pending, setPending] = useState<RowAction | null>(null);
  const [busy, setBusy] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current?.contains(event.target as Node)) return;
      if (buttonRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen((value) => !value);
  }

  function run(action: RowAction) {
    setOpen(false);
    if (action.confirm) {
      setPending(action);
      return;
    }
    void action.onSelect();
  }

  async function confirmPending() {
    if (!pending) return;
    setBusy(true);
    try {
      await pending.onSelect();
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={toggle}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-navy transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.9" />
          <circle cx="12" cy="12" r="1.9" />
          <circle cx="12" cy="19" r="1.9" />
        </svg>
      </button>
      {open ? (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: coords.top, right: coords.right }}
          className="fixed z-[60] w-44 overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-card"
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              disabled={action.disabled}
              onClick={() => run(action)}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                action.tone === "danger"
                  ? "text-brand-dark hover:bg-brand-soft"
                  : "text-navy hover:bg-background"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
      {pending?.confirm ? (
        <ConfirmDialog
          title={pending.confirm.title}
          message={pending.confirm.message}
          confirmLabel={pending.confirm.confirmLabel}
          tone={pending.confirm.tone}
          busy={busy}
          onConfirm={() => void confirmPending()}
          onCancel={() => {
            if (!busy) setPending(null);
          }}
        />
      ) : null}
    </>
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

function DataTableContents({
  columns,
  rows,
  emptyMessage = "There are no records to display.",
  filterLabel = "All statuses",
  extraFilterLabel = "All types",
  exportName = "ibanga-export",
  initialFilter = "",
}: {
  columns: { label: string; className?: string }[];
  rows: DataTableRow[];
  emptyMessage?: string;
  filterLabel?: string;
  extraFilterLabel?: string;
  exportName?: string;
  initialFilter?: string;
}) {
  const [search, setSearchValue] = useState("");
  const searchParams = useSearchParams();
  const queryStatus = searchParams.get("status") ?? "";
  const [manualFilter, setManualFilter] = useState<{ query: string; value: string } | null>(null);
  const filter = manualFilter?.query === queryStatus ? manualFilter.value : queryStatus || initialFilter;
  const [extraFilter, setExtraFilterValue] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeValue] = useState(10);
  // Changing any filter returns to the first page (done in the handlers, not in an effect).
  const setSearch = (value: string) => { setSearchValue(value); setPage(1); };
  const setFilter = (value: string) => { setManualFilter({ query: queryStatus, value }); setPage(1); };
  const setExtraFilter = (value: string) => { setExtraFilterValue(value); setPage(1); };
  const setPageSize = (value: number) => { setPageSizeValue(value); setPage(1); };
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
    && (!filter || filter.split(",").includes(row.filterValue ?? ""))
    && (!extraFilter || row.extraFilterValue === extraFilter),
  ), [extraFilter, filter, rows, search]);
  const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = visibleRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allVisibleSelected = pageRows.length > 0 && pageRows.every((row) => selected.has(row.id));

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
              {filter.includes(",") ? <option value={filter}>{filter.split(",").map((status) => status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())).join(", ")}</option> : null}
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
          <thead className="border-b border-line bg-background text-sm text-muted">
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

type DataTableProps = Parameters<typeof DataTableContents>[0];

export function DataTable(props: DataTableProps) {
  return (
    <Suspense fallback={<div className="rounded-xl border border-line bg-white px-5 py-12 text-center text-sm text-muted">Loading records...</div>}>
      <DataTableContents {...props} />
    </Suspense>
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
    bar: "bg-brand/60",
    chip: "bg-brand-soft text-brand-dark",
    icon: "bg-brand-soft text-brand",
  },
  good: {
    bar: "bg-brand",
    chip: "bg-brand-soft text-brand-dark",
    icon: "bg-brand-soft text-brand",
  },
  warn: {
    bar: "bg-brand/45",
    chip: "bg-brand-soft text-brand-dark",
    icon: "bg-brand-soft text-brand",
  },
  bad: {
    bar: "bg-navy",
    chip: "bg-navy text-white",
    icon: "bg-navy text-white",
  },
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "brand",
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  accent?: "brand" | "accent" | "good" | "warn" | "bad";
  href?: string;
}) {
  const tone = statAccents[accent];
  const content = (
    <>
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
    </>
  );
  const className = `group flex min-h-[132px] flex-col rounded-xl border border-line bg-card p-4 shadow-soft transition-all duration-200 motion-reduce:transition-none ${href ? "cursor-pointer hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2" : "hover:border-brand/25 hover:shadow-md"}`;
  return href ? <Link href={href} aria-label={`${label}: ${value}. ${hint ?? "View details"}`} className={className}>{content}</Link> : <article className={className}>{content}</article>;
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
    <div className="rounded-xl border border-dashed border-line bg-card px-6 py-14 text-center">
      <div>
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-brand-soft text-brand [&_svg]:h-4.5 [&_svg]:w-4.5">
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
