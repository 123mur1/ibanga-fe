"use client";

import { useCallback, useRef, useState } from "react";
import { useToast } from "@/components/toast";
import { errorMessage, ServiceError } from "@/services/types";

type RunOptions<T> = {
  /** Toast shown on success. */
  success?: string | ((result: T) => string);
  /** Called with the error, e.g. to put field errors back into a form. */
  onError?: (error: unknown, fieldErrors: Record<string, string> | undefined) => void;
  /** Show the error as a toast (default true). Set false when the form shows it inline. */
  toastError?: boolean;
};

/**
 * Runs a mutation with a busy flag, success/failure toasts and protection against double
 * submission: a second call while one is running is ignored, so a double-click can never create
 * two bookings or payments.
 */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const lock = useRef(false);

  const run = useCallback(
    async <T,>(task: () => Promise<T>, options: RunOptions<T> = {}): Promise<T | undefined> => {
      if (lock.current) return undefined;
      lock.current = true;
      setBusy(true);
      setFieldErrors({});
      try {
        const result = await task();
        if (options.success) toast(typeof options.success === "function" ? options.success(result) : options.success, "good");
        return result;
      } catch (error) {
        const fields = error instanceof ServiceError ? error.fieldErrors : undefined;
        setFieldErrors(fields ?? {});
        if (options.toastError !== false) toast(errorMessage(error), "bad");
        options.onError?.(error, fields);
        return undefined;
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [toast],
  );

  return { run, busy, fieldErrors };
}
