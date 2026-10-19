"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useIbanga } from "@/lib/store";
import { errorMessage, ServiceError, type ServiceErrorCode } from "@/services/types";
import { useOps } from "./use-ops";

export type QueryState<T> = {
  data: T | undefined;
  /** True only until the first result arrives; refetches keep showing the previous data. */
  loading: boolean;
  error: string | undefined;
  /** Set for ServiceError failures, e.g. FORBIDDEN or NOT_FOUND. */
  errorCode?: ServiceErrorCode | undefined;
  refetch: () => void;
};

/**
 * Runs a service call and re-runs it whenever the demonstration data or marketplace data
 * changes, so screens refresh themselves after any action. `fetcher` may be an inline function;
 * pass values that should trigger a refetch (route params, filters) in `deps`.
 *
 * With a real API this would become a normal fetch hook (or React Query) with the same shape.
 */
export function useServiceQuery<T>(fetcher: () => Promise<T>, deps: readonly unknown[] = []): QueryState<T> {
  const ops = useOps();
  const { bookings, trucks, users } = useIbanga();
  const [state, setState] = useState<{ data: T | undefined; error: string | undefined; errorCode: ServiceErrorCode | undefined; loading: boolean }>({
    data: undefined,
    error: undefined,
    errorCode: undefined,
    loading: true,
  });
  const [tick, setTick] = useState(0);
  const latest = useRef(fetcher);

  useEffect(() => {
    latest.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    latest
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, error: undefined, errorCode: undefined, loading: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState((previous) => ({
            data: previous.data,
            error: errorMessage(error, "Could not load this data."),
            errorCode: error instanceof ServiceError ? error.code : undefined,
            loading: false,
          }));
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ops, bookings, trucks, users, tick, ...deps]);

  const refetch = useCallback(() => setTick((value) => value + 1), []);
  return { ...state, refetch };
}
