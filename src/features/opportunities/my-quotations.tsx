"use client";

import Link from "next/link";
import { QueryBoundary } from "@/components/common/async-state";
import { Notice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, ViewLink } from "@/components/ui";
import type { QueryState } from "@/hooks/use-service-query";
import { formatDate, formatRwf } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import type { Paged } from "@/services/types";
import type { CargoRequest, Quotation } from "@/types/ops";

/** All of the signed-in owner's quotations. The service already scopes the list to the owner. */
export function MyQuotations({ query, requests }: { query: QueryState<Paged<Quotation>>; requests: CargoRequest[] }) {
  const { trucks } = useIbanga();
  return (
    <div className="space-y-4">
      <Notice title="A quotation is not a booking">
        An accepted quotation creates a booking, which you will find under{" "}
        <Link href="/dashboard/owner/bookings" className="font-semibold underline underline-offset-2">Bookings</Link>. Until then the importer can still choose another offer.
      </Notice>
      <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0} empty={{ title: "No quotations yet", text: "Open a cargo request and send your first quotation." }}>
        {(data) => (
          <DataTable
            columns={[{ label: "Request" }, { label: "Truck" }, { label: "Price" }, { label: "Valid until" }, { label: "Status" }, { label: "Next step" }, { label: "Actions", className: "text-right" }]}
            filterLabel="All statuses"
            exportName="ibanga-my-quotations"
            rows={data.items.map((quote) => {
              const request = requests.find((item) => item.id === quote.cargoRequestId);
              const truck = trucks.find((item) => item.id === quote.truckId);
              const route = request ? `${request.pickup.location} to ${request.delivery.location}` : quote.cargoRequestId;
              const bookingLink = quote.status === "ACCEPTED" && request?.bookingId ? `/dashboard/owner/bookings/${request.bookingId}` : undefined;
              return {
                id: quote.id,
                searchText: `${quote.ref} ${route} ${truck?.plateNumber ?? ""} ${quote.status}`,
                filterValue: quote.status,
                exportValues: [`${quote.ref} ${route}`, truck?.plateNumber ?? "", formatRwf(quote.amountRwf), formatDate(quote.validUntil), quote.status, "", ""],
                cells: [
                  <span key="r" className="min-w-40"><strong className="block">{route}</strong><span className="text-xs text-muted">{quote.ref}</span></span>,
                  truck?.plateNumber ?? "—",
                  <strong key="p">{formatRwf(quote.amountRwf)}</strong>,
                  formatDate(quote.validUntil),
                  <StatusBadge key="s" family="quotation" status={quote.status} />,
                  bookingLink ? (
                    <Link key="n" href={bookingLink} className="text-sm font-semibold text-brand hover:text-brand-dark">Open booking</Link>
                  ) : (
                    <span key="n" className="text-sm text-muted">{quote.status === "SUBMITTED" ? "Waiting for the importer" : "No booking"}</span>
                  ),
                  <div key="a" className="flex justify-end"><ViewLink href={`/dashboard/owner/opportunities/${quote.cargoRequestId}`} label={`View request for quotation ${quote.ref}`} /></div>,
                ],
              };
            })}
          />
        )}
      </QueryBoundary>
    </div>
  );
}
