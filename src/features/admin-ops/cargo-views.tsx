"use client";

import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { ConfirmButton } from "@/components/common/confirm-button";
import { controlClass, FormField } from "@/components/common/form-fields";
import { DetailList, Section, StatGrid } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, StatCard, ViewLink } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate, formatDateTime, formatRwf, formatTons, titleCase } from "@/lib/format";
import { services } from "@/services";
import type { CargoRequest, CargoStop } from "@/types/ops";
import { TextLink, useAdminLookups } from "./use-admin";

type SortKey = "newest" | "oldest" | "budget" | "weight";

const SORTS: Record<SortKey, { label: string; compare: (a: CargoRequest, b: CargoRequest) => number }> = {
  newest: { label: "Newest first", compare: (a, b) => b.createdAt.localeCompare(a.createdAt) },
  oldest: { label: "Oldest first", compare: (a, b) => a.createdAt.localeCompare(b.createdAt) },
  budget: { label: "Highest budget", compare: (a, b) => (b.budgetRwf ?? 0) - (a.budgetRwf ?? 0) },
  weight: { label: "Heaviest cargo", compare: (a, b) => b.weightTons - a.weightTons },
};

export function CargoRequestList() {
  const actor = useActor();
  const { userName } = useAdminLookups();
  const [sort, setSort] = useState<SortKey>("newest");
  const query = useServiceQuery(() => services.cargoRequests.list(actor!, { pageSize: 500 }), [actor?.id]);

  return (
    <div className="mt-6">
      <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0} empty={{ title: "No cargo requests", text: "Requests appear when importers publish them." }}>
        {(data) => {
          const count = (status: string) => data.items.filter((item) => item.status === status).length;
          const items = [...data.items].sort(SORTS[sort].compare);
          return (
            <>
              <StatGrid>
                <StatCard label="Requests" value={data.total} hint="All importers" />
                <StatCard label="Open for quotes" value={count("OPEN") + count("QUOTED")} hint="Waiting for a booking" accent="warn" />
                <StatCard label="Booked" value={count("BOOKED")} hint="Quote accepted" accent="good" />
                <StatCard label="Cancelled" value={count("CANCELLED")} hint="Withdrawn or cancelled" accent="bad" />
              </StatGrid>
              <div className="mt-5 flex max-w-xs flex-col">
                <FormField label="Sort by">
                  <select className={controlClass} value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
                    {Object.entries(SORTS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
                  </select>
                </FormField>
              </div>
              <div className="mt-3">
                <DataTable
                  columns={[{ label: "Request" }, { label: "Importer" }, { label: "Route" }, { label: "Cargo" }, { label: "Budget" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
                  filterLabel="All statuses"
                  extraFilterLabel="All importers"
                  exportName="ibanga-admin-cargo-requests"
                  emptyMessage="No cargo requests match."
                  rows={items.map((item) => ({
                    id: item.id,
                    searchText: `${item.ref} ${item.title} ${userName(item.importerId)} ${item.pickup.location} ${item.delivery.location}`,
                    filterValue: item.status,
                    extraFilterValue: userName(item.importerId),
                    exportValues: [item.ref, item.title, userName(item.importerId), `${item.pickup.location} to ${item.delivery.location}`, formatTons(item.weightTons), item.budgetRwf ? formatRwf(item.budgetRwf) : "", item.status, ""],
                    cells: [
                      <span key="r"><strong className="block">{item.title}</strong><span className="text-xs text-muted">{item.ref} · {formatDate(item.createdAt)}</span></span>,
                      userName(item.importerId),
                      `${item.pickup.location} to ${item.delivery.location}`,
                      `${titleCase(item.category)} · ${formatTons(item.weightTons)}`,
                      item.budgetRwf ? formatRwf(item.budgetRwf) : "Open",
                      <StatusBadge key="s" family="cargoRequest" status={item.status} />,
                      <div key="a" className="flex justify-end"><ViewLink href={`/dashboard/admin/cargo-requests/${item.id}`} label={`View ${item.ref}`} /></div>,
                    ],
                  }))}
                />
              </div>
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}

function Stop({ label, stop }: { label: string; stop: CargoStop }) {
  return (
    <div className="rounded-xl border border-line p-4 text-sm">
      <p className="font-semibold text-navy">{label}</p>
      <p className="mt-1 text-navy">{stop.location}</p>
      <p className="text-muted">{stop.address}</p>
      <p className="mt-2 text-muted">{stop.contactName} · {stop.contactPhone}</p>
      <p className="text-muted">{formatDate(stop.date)}</p>
    </div>
  );
}

function CancelCargo({ request }: { request: CargoRequest }) {
  const actor = useActor();
  const { run, busy } = useAction();
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const valid = reason.trim().length >= 5;
  const open = ["DRAFT", "OPEN", "QUOTED"].includes(request.status);

  if (request.status === "BOOKED") {
    return <Notice tone="info" title="Already booked">A booked request is cancelled through its booking and the cancellation workflow, so fees and refunds are handled correctly.</Notice>;
  }
  if (!open) return <p className="text-sm text-muted">This request is {titleCase(request.status)} and cannot be cancelled.</p>;
  return (
    <div className="space-y-4">
      <FormField label="Reason for cancelling" required hint="Shown to the importer." error={touched && !valid ? "Enter at least 5 characters." : undefined}>
        <textarea rows={3} className={controlClass} value={reason} disabled={busy} aria-invalid={touched && !valid} onChange={(event) => setReason(event.target.value)} onBlur={() => setTouched(true)} />
      </FormField>
      <ConfirmButton
        label="Cancel request"
        title={`Cancel ${request.ref}?`}
        message="The request is closed for quotes."
        summary={["Open quotations can no longer be accepted", "The importer is notified with your reason", "This cannot be undone"]}
        tone="danger"
        variant="ghost"
        disabled={busy || !valid}
        onConfirm={() => run(() => services.cargoRequests.cancel(actor!, request.id, reason.trim()), { success: "Cargo request cancelled." })}
      />
    </div>
  );
}

function Quotations({ requestId }: { requestId: string }) {
  const actor = useActor();
  const { userName, truckLabel } = useAdminLookups();
  const query = useServiceQuery(() => services.quotations.listForRequest(actor!, requestId), [actor?.id, requestId]);
  return (
    <QueryBoundary query={query} isEmpty={(items) => items.length === 0} empty={{ title: "No quotations yet", text: "Truck owners have not quoted on this request." }}>
      {(items) => (
        <ul className="divide-y divide-line text-sm">
          {items.map((quote) => (
            <li key={quote.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span>
                <strong className="text-navy">{formatRwf(quote.amountRwf)}</strong> · {userName(quote.ownerId)}
                <span className="block text-xs text-muted">
                  <TextLink href={`/dashboard/admin/trucks/${quote.truckId}`}>{truckLabel(quote.truckId)}</TextLink> · {quote.ref} · valid until {formatDate(quote.validUntil)}
                </span>
              </span>
              <StatusBadge family="quotation" status={quote.status} />
            </li>
          ))}
        </ul>
      )}
    </QueryBoundary>
  );
}

function CargoBody({ request }: { request: CargoRequest }) {
  const { userName } = useAdminLookups();
  return (
    <div className="space-y-5">
      {request.status === "CANCELLED" ? <Notice tone="warning" title="Cancelled">{request.cancelledReason ?? "No reason recorded."}</Notice> : null}
      <Section title="Request" actions={<StatusBadge family="cargoRequest" status={request.status} />}>
        <DetailList
          items={[
            { label: "Reference", value: `${request.ref}` },
            { label: "Importer", value: userName(request.importerId) },
            { label: "Title", value: request.title },
            { label: "Category", value: titleCase(request.category) },
            { label: "Weight", value: formatTons(request.weightTons) },
            { label: "Volume", value: `${request.volumeM3} m³` },
            { label: "Size", value: `${request.lengthM} x ${request.widthM} x ${request.heightM} m` },
            { label: "Truck type", value: `${request.truckType} · min ${formatTons(request.minCapacityTons)}` },
            { label: "Declared value", value: formatRwf(request.valueRwf) },
            { label: "Budget", value: request.budgetRwf ? formatRwf(request.budgetRwf) : "Open to offers" },
            { label: "Handling", value: request.flags.length ? request.flags.map(titleCase).join(", ") : "Standard" },
            { label: "Created", value: formatDateTime(request.createdAt) },
            { label: "Description", value: request.description, wide: true },
            { label: "Loading", value: request.loadingRequirements || "—" },
            { label: "Unloading", value: request.unloadingRequirements || "—" },
            { label: "Instructions", value: request.instructions || "—", wide: true },
          ]}
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Stop label="Pickup" stop={request.pickup} />
          <Stop label="Delivery" stop={request.delivery} />
        </div>
      </Section>
      <Section title="Quotations" description="A quotation is a price offer, not a booking and not a payment.">
        <Quotations requestId={request.id} />
      </Section>
      <Section title="Linked booking">
        {request.bookingId ? (
          <p className="text-sm">
            Booked as <TextLink href={`/dashboard/admin/bookings/${request.bookingId}`}>booking {request.bookingId}</TextLink>. Quotation {request.acceptedQuotationId ?? "—"} was accepted.
          </p>
        ) : (
          <p className="text-sm text-muted">No booking has been created from this request.</p>
        )}
      </Section>
      <Section title="Administrator cancellation" description="Use for policy violations or requests that should not continue.">
        <CancelCargo request={request} />
      </Section>
    </div>
  );
}

export function CargoRequestDetail({ id }: { id: string }) {
  const actor = useActor();
  const query = useServiceQuery(() => services.cargoRequests.get(actor!, id), [actor?.id, id]);
  return (
    <div className="mt-6">
      <QueryBoundary query={query}>{(request) => <CargoBody request={request} />}</QueryBoundary>
    </div>
  );
}
