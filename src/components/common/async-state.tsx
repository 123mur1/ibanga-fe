"use client";

import type { QueryState } from "@/hooks/use-service-query";
import { EmptyState } from "@/components/ui";

export function LoadingBlock({ label = "Loading…", rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3 rounded-2xl border border-line bg-card p-5 shadow-soft">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-5 animate-pulse rounded-md bg-line" style={{ width: `${92 - index * 14}%` }} />
      ))}
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-bad/25 bg-bad-soft px-5 py-8 text-center">
      <p className="font-semibold text-bad">We could not load this</p>
      <p className="mt-1 text-sm text-bad/90">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-4 rounded-lg border border-bad/30 bg-white px-4 py-2 text-sm font-semibold text-bad hover:bg-bad-soft">
          Try again
        </button>
      ) : null}
    </div>
  );
}

/**
 * Standard loading / error / empty handling for a service query:
 * `<QueryBoundary query={query} empty={...}>{(data) => ...}</QueryBoundary>`.
 */
export function QueryBoundary<T>({
  query,
  children,
  isEmpty,
  empty,
  loadingLabel,
}: {
  query: QueryState<T>;
  children: (data: T) => React.ReactNode;
  isEmpty?: (data: T) => boolean;
  empty?: { title: string; text: string; action?: React.ReactNode };
  loadingLabel?: string;
}) {
  if (query.error && query.data === undefined) {
    if (query.errorCode === "FORBIDDEN" || query.errorCode === "NOT_FOUND") {
      return (
        <div role="alert" className="rounded-2xl border border-line bg-card px-5 py-10 text-center shadow-soft">
          <p className="font-display text-xl text-navy">{query.errorCode === "FORBIDDEN" ? "You do not have access to this" : "We could not find this"}</p>
          <p className="mt-1 text-sm text-muted">{query.error}</p>
        </div>
      );
    }
    return <ErrorBlock message={query.error} onRetry={query.refetch} />;
  }
  if (query.data === undefined) return <LoadingBlock label={loadingLabel} />;
  if (isEmpty?.(query.data) && empty) return <EmptyState title={empty.title} text={empty.text} action={empty.action} />;
  return <>{children(query.data)}</>;
}
