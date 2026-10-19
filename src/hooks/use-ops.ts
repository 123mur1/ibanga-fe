"use client";

import { useSyncExternalStore } from "react";
import type { OpsData } from "@/types/ops";
import { mockDb } from "@/services/mock-db";

/**
 * The whole demonstration dataset, re-rendering on every change. Use it for synchronous
 * read-only lookups (counts, joins, selects). For anything that mimics an API call, prefer
 * `useServiceQuery` so loading and error states are handled.
 *
 * Derive lists with `useMemo` instead of filtering inline in a selector: the returned object
 * is stable between changes, derived arrays are not.
 */
export function useOps(): OpsData {
  return useSyncExternalStore(mockDb.subscribe, mockDb.getSnapshot, mockDb.getServerSnapshot);
}
