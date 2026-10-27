import { api, ApiError } from "@/lib/api";
import type { Booking } from "@/lib/types";
import type { CargoRequest, Quotation, Shipment } from "@/types/ops";
import type {
  CargoRequestInput,
  CargoRequestService,
  QuotationInput,
  QuotationService,
} from "../contracts";
import { ServiceError, type Actor, type ListQuery, type Paged } from "../types";

type ApiPage<T> = Paged<T>;

function serviceError(error: unknown): never {
  if (!(error instanceof ApiError)) throw error;
  const code =
    error.status === 403
      ? "FORBIDDEN"
      : error.status === 404
        ? "NOT_FOUND"
        : error.status === 409
          ? "CONFLICT"
          : "VALIDATION";
  throw new ServiceError(code, error.message, error.fieldErrors);
}

function queryString(query?: ListQuery) {
  const params = new URLSearchParams();
  params.set("page", String(query?.page ?? 1));
  params.set("pageSize", String(query?.pageSize ?? 10));
  if (query?.search?.trim()) params.set("search", query.search.trim());
  return `?${params.toString()}`;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await api<T>(path, init);
  } catch (error) {
    serviceError(error);
  }
}

export const apiCargoRequestService: CargoRequestService = {
  async list(_actor, query) {
    return call<ApiPage<CargoRequest>>(
      `/operations/cargo-requests${queryString(query)}`,
    );
  },

  async get(_actor, id) {
    return call<CargoRequest>(
      `/operations/cargo-requests/${encodeURIComponent(id)}`,
    );
  },

  async create(_actor, input: CargoRequestInput, draft) {
    return call<CargoRequest>("/operations/cargo-requests", {
      method: "POST",
      body: JSON.stringify({ data: input, draft }),
    });
  },

  async update(actor: Actor, id, patch) {
    const current = await this.get(actor, id);
    return call<CargoRequest>(
      `/operations/cargo-requests/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ data: { ...current, ...patch } }),
      },
    );
  },

  async publishDraft(_actor, id) {
    return call<CargoRequest>(
      `/operations/cargo-requests/${encodeURIComponent(id)}/publish`,
      { method: "POST" },
    );
  },

  async cancel(_actor, id, reason) {
    return call<CargoRequest>(
      `/operations/cargo-requests/${encodeURIComponent(id)}/cancel`,
      { method: "POST", body: JSON.stringify({ reason }) },
    );
  },
};

export const apiQuotationService: QuotationService = {
  async listForRequest(_actor, cargoRequestId) {
    return call<Quotation[]>(
      `/operations/cargo-requests/${encodeURIComponent(cargoRequestId)}/quotations`,
    );
  },

  async list(_actor, query) {
    return call<ApiPage<Quotation>>(
      `/operations/quotations${queryString(query)}`,
    );
  },

  async submit(_actor, input: QuotationInput) {
    return call<Quotation>("/operations/quotations", {
      method: "POST",
      body: JSON.stringify({ data: input }),
    });
  },

  async withdraw(_actor, id) {
    return call<Quotation>(
      `/operations/quotations/${encodeURIComponent(id)}/withdraw`,
      { method: "POST" },
    );
  },

  async accept(_actor, id) {
    return call<{
      quotation: Quotation;
      shipment: Shipment;
      booking: Pick<Booking, "id">;
    }>(`/operations/quotations/${encodeURIComponent(id)}/accept`, {
      method: "POST",
    });
  },
};
