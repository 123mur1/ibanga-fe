import type { Role } from "@/lib/types";

/** The signed-in user performing an action. A real backend derives this from the session token. */
export type Actor = { id: string; name: string; role: Role };

export type SortDirection = "asc" | "desc";

/** Every list method accepts the same query so server-side pagination can replace this later. */
export type ListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: { field: string; direction: SortDirection };
  /** Exact-match filters, e.g. `{ status: "OPEN" }`. Empty strings are ignored. */
  filters?: Record<string, string | undefined>;
};

export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export type ServiceErrorCode = "NOT_FOUND" | "VALIDATION" | "FORBIDDEN" | "CONFLICT" | "SIMULATED_FAILURE";

/** Consistent error shape. A future API client should map HTTP errors into this class. */
export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  readonly fieldErrors?: Record<string, string>;

  constructor(code: ServiceErrorCode, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  return error instanceof Error ? error.message : fallback;
}
