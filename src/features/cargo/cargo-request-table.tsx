"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, ViewLink } from "@/components/ui";
import { formatDate, formatRwf, formatTons } from "@/lib/format";
import { CATEGORY_LABEL } from "./booking-from-quotation";
import type { CargoRequest } from "@/types/ops";

type Sort = "newest" | "oldest" | "title" | "weight" | "pickup";

const SORTS: Record<Sort, { label: string; compare: (a: CargoRequest, b: CargoRequest) => number }> = {
  newest: { label: "Newest first", compare: (a, b) => b.createdAt.localeCompare(a.createdAt) },
  oldest: { label: "Oldest first", compare: (a, b) => a.createdAt.localeCompare(b.createdAt) },
  title: { label: "Title A to Z", compare: (a, b) => a.title.localeCompare(b.title) },
  weight: { label: "Heaviest first", compare: (a, b) => b.weightTons - a.weightTons },
  pickup: { label: "Pickup date", compare: (a, b) => a.pickup.date.localeCompare(b.pickup.date) },
};

/** Cargo requests with search and status filter (DataTable), plus a sort control. */
export function CargoRequestTable({ requests }: { requests: CargoRequest[] }) {
  const [sort, setSort] = useState<Sort>("newest");
  const sorted = [...requests].sort(SORTS[sort].compare);

  return (
    <div className="space-y-3">
      <label className="flex items-center justify-end gap-2 text-sm text-muted">
        Sort by
        <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy outline-none focus:border-brand">
          {Object.entries(SORTS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
        </select>
      </label>
      <DataTable
        columns={[
          { label: "Request" },
          { label: "Route" },
          { label: "Cargo" },
          { label: "Budget" },
          { label: "Pickup" },
          { label: "Status" },
          { label: "Actions", className: "text-right" },
        ]}
        emptyMessage="No cargo requests match your search."
        filterLabel="All statuses"
        exportName="ibanga-cargo-requests"
        rows={sorted.map((request) => {
          const route = `${request.pickup.location || "—"} to ${request.delivery.location || "—"}`;
          return {
            id: request.id,
            searchText: `${request.ref} ${request.title} ${route} ${CATEGORY_LABEL[request.category]} ${request.status}`,
            filterValue: request.status,
            exportValues: [request.ref, route, `${request.title} (${formatTons(request.weightTons)})`, request.budgetRwf ? formatRwf(request.budgetRwf) : "", formatDate(request.pickup.date), request.status, ""],
            cells: [
              <span key="ref" className="min-w-36"><strong className="block text-brand">{request.ref}</strong><span className="text-xs text-muted">{formatDate(request.createdAt)}</span></span>,
              <span key="route" className="min-w-40 font-semibold">{route}</span>,
              <span key="cargo" className="block min-w-40"><strong className="block">{request.title}</strong><span className="text-xs text-muted">{CATEGORY_LABEL[request.category]} · {formatTons(request.weightTons)}</span></span>,
              request.budgetRwf ? formatRwf(request.budgetRwf) : <span key="nb" className="text-muted">Not set</span>,
              formatDate(request.pickup.date),
              <StatusBadge key="status" family="cargoRequest" status={request.status} />,
              <div key="action" className="flex justify-end"><ViewLink href={`/dashboard/importer/cargo-requests/${request.id}`} label={`View ${request.ref}`} /></div>,
            ],
          };
        })}
      />
    </div>
  );
}
