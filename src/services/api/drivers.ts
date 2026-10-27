import { api, ApiError } from "@/lib/api";
import type { Driver } from "@/types/ops";
import type { DriverCreateInput, DriverService } from "../contracts";
import { ServiceError, type ListQuery, type Paged } from "../types";

type ApiPage<T> = Paged<T>;

function serviceError(error: unknown): never {
  if (!(error instanceof ApiError)) throw error;
  const code =
    error.status === 403 || error.status === 401
      ? "FORBIDDEN"
      : error.status === 404
        ? "NOT_FOUND"
        : error.status === 409
          ? "CONFLICT"
          : "VALIDATION";
  throw new ServiceError(code, error.message, error.fieldErrors);
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await api<T>(path, init);
  } catch (error) {
    serviceError(error);
  }
}

function queryString(query?: ListQuery) {
  const params = new URLSearchParams();
  params.set("page", String(query?.page ?? 1));
  params.set("pageSize", String(query?.pageSize ?? 25));
  if (query?.search?.trim()) params.set("search", query.search.trim());
  return `?${params.toString()}`;
}

export const apiDriverService: Pick<
  DriverService,
  "list" | "get" | "create" | "update" | "setStatus"
> = {
  async list(_actor, query) {
    return call<ApiPage<Driver>>(`/operations/drivers${queryString(query)}`);
  },

  async get(_actor, id) {
    return call<Driver>(`/operations/drivers/${encodeURIComponent(id)}`);
  },

  async create(_actor, input: DriverCreateInput) {
    return call<Driver>("/operations/drivers", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async update(actor, id, patch) {
    const current = await this.get(actor, id);
    return call<Driver>(`/operations/drivers/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ data: { ...current, ...patch } }),
    });
  },

  async setStatus(actor, id, status) {
    return this.update(actor, id, { status });
  },
};
