"use client";

import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { controlClass } from "@/components/common/form-fields";
import { Notice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { Tabs } from "@/components/common/tabs";
import { DataTable, StatCard, ViewLink } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate, formatRwf, formatTons } from "@/lib/format";
import { TRUCK_TYPES } from "@/lib/types";
import { services } from "@/services";
import type { CargoRequest, HandlingFlag } from "@/types/ops";
import { CATEGORY_LABEL, FLAG_LABEL, FlagChips } from "./labels";
import { MyQuotations } from "./my-quotations";

type Tab = "open" | "mine";

const isOpen = (item: CargoRequest) => item.status === "OPEN" || item.status === "QUOTED";

export function OpportunitiesList() {
  const actor = useActor();
  const [tab, setTab] = useState<Tab>("open");
  const [route, setRoute] = useState("");
  const [truckType, setTruckType] = useState("");
  const [minWeight, setMinWeight] = useState("");
  const [flag, setFlag] = useState<HandlingFlag | "">("");

  const requests = useServiceQuery(() => services.cargoRequests.list(actor!, { pageSize: 200 }), [actor?.id]);
  const quotes = useServiceQuery(() => services.quotations.list(actor!, { pageSize: 200 }), [actor?.id]);

  const quotedIds = new Set(
    (quotes.data?.items ?? []).filter((quote) => quote.status === "SUBMITTED" || quote.status === "ACCEPTED").map((quote) => quote.cargoRequestId),
  );
  const minimum = Number(minWeight) || 0;

  function matches(item: CargoRequest) {
    if (!isOpen(item)) return false;
    const text = `${item.pickup.location} ${item.pickup.address} ${item.delivery.location} ${item.delivery.address}`.toLowerCase();
    return (
      (!route.trim() || text.includes(route.trim().toLowerCase())) &&
      (!truckType || item.truckType === truckType) &&
      item.weightTons >= minimum &&
      (!flag || item.flags.includes(flag))
    );
  }

  return (
    <div className="mt-6 space-y-5">
      <Tabs
        label="Opportunities"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "open", label: "Open cargo requests", count: requests.data?.items.filter(isOpen).length },
          { key: "mine", label: "My quotations", count: quotes.data?.total },
        ]}
      />

      {tab === "mine" ? (
        <MyQuotations query={quotes} requests={requests.data?.items ?? []} />
      ) : (
        <>
          <Notice title="A quotation is an offer, not a booking">
            You only get a booking if the importer accepts your quotation. Importer contact details are shared after that. Payment is a separate step.
          </Notice>
          <fieldset className="grid gap-3 rounded-2xl border border-line bg-card p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
            <legend className="sr-only">Filter opportunities</legend>
            <label className="block text-sm font-medium text-navy">
              Route or place
              <input className={`${controlClass} mt-1.5`} value={route} onChange={(event) => setRoute(event.target.value)} placeholder="e.g. Kigali, Mombasa" />
            </label>
            <label className="block text-sm font-medium text-navy">
              Truck type
              <select className={`${controlClass} mt-1.5`} value={truckType} onChange={(event) => setTruckType(event.target.value)}>
                <option value="">Any truck type</option>
                {TRUCK_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-navy">
              Minimum weight (tons)
              <input className={`${controlClass} mt-1.5`} type="number" min={0} step="0.5" inputMode="decimal" value={minWeight} onChange={(event) => setMinWeight(event.target.value)} placeholder="0" />
            </label>
            <label className="block text-sm font-medium text-navy">
              Handling flag
              <select className={`${controlClass} mt-1.5`} value={flag} onChange={(event) => setFlag(event.target.value as HandlingFlag | "")}>
                <option value="">Any handling</option>
                {Object.entries(FLAG_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </fieldset>

          <QueryBoundary
            query={requests}
            isEmpty={(data) => data.items.filter(matches).length === 0}
            empty={{ title: "No matching cargo requests", text: "No open request fits these filters. Clear a filter or check back later." }}
          >
            {(data) => {
              const items = data.items.filter(matches);
              return (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="Open requests" value={items.length} hint="Matching your filters" />
                    <StatCard label="Already quoted" value={items.filter((item) => quotedIds.has(item.id)).length} hint="You have an active quotation" accent="warn" />
                    <StatCard label="Total cargo" value={formatTons(items.reduce((sum, item) => sum + item.weightTons, 0))} hint="Across these requests" accent="accent" />
                  </div>
                  <DataTable
                    columns={[{ label: "Route" }, { label: "Dates" }, { label: "Cargo" }, { label: "Handling" }, { label: "Budget" }, { label: "Your quote" }, { label: "Actions", className: "text-right" }]}
                    emptyMessage="No cargo requests to show."
                    filterLabel="All requests"
                    exportName="ibanga-cargo-opportunities"
                    rows={items.map((item) => {
                      const routeText = `${item.pickup.location} to ${item.delivery.location}`;
                      const quoted = quotedIds.has(item.id);
                      return {
                        id: item.id,
                        searchText: `${item.ref} ${item.title} ${routeText} ${CATEGORY_LABEL[item.category]} ${item.truckType}`,
                        filterValue: quoted ? "Already quoted" : "Not quoted yet",
                        exportValues: [
                          `${item.ref} ${routeText}`,
                          `${formatDate(item.pickup.date)} - ${formatDate(item.delivery.date)}`,
                          `${item.weightTons} t ${CATEGORY_LABEL[item.category]}`,
                          item.flags.join(", "),
                          item.budgetRwf ? formatRwf(item.budgetRwf) : "Not stated",
                          quoted ? "Yes" : "No",
                          "",
                        ],
                        cells: [
                          <span key="r" className="min-w-44"><strong className="block">{routeText}</strong><span className="text-xs text-muted">{item.ref} · {item.title}</span></span>,
                          <span key="d" className="text-sm">{formatDate(item.pickup.date)}<br /><span className="text-xs text-muted">to {formatDate(item.delivery.date)}</span></span>,
                          <span key="c" className="text-sm"><strong>{formatTons(item.weightTons)}</strong><br /><span className="text-xs text-muted">{CATEGORY_LABEL[item.category]} · {item.truckType}</span></span>,
                          <FlagChips key="f" flags={item.flags} />,
                          item.budgetRwf ? formatRwf(item.budgetRwf) : <span key="b" className="text-muted">Not stated</span>,
                          quoted ? <StatusBadge key="q" family="quotation" status="SUBMITTED" label="Already quoted" /> : <span key="q" className="text-sm text-muted">Not quoted</span>,
                          <div key="a" className="flex justify-end"><ViewLink href={`/dashboard/owner/opportunities/${item.id}`} label={`View cargo request ${item.ref}`} /></div>,
                        ],
                      };
                    })}
                  />
                </>
              );
            }}
          </QueryBoundary>
        </>
      )}
    </div>
  );
}
