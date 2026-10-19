"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BackLink, DetailList, Section } from "@/components/common/layout-blocks";
import { QueryBoundary } from "@/components/common/async-state";
import { ConfirmButton } from "@/components/common/confirm-button";
import { Notice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate, formatRwf, formatTons } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { CargoRequest, Quotation } from "@/types/ops";
import { CATEGORY_LABEL, FlagChips } from "./labels";
import { QuotationForm } from "./quotation-form";

export function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const actor = useActor();
  const request = useServiceQuery(() => services.cargoRequests.get(actor!, id), [actor?.id, id]);
  const mine = useServiceQuery(() => services.quotations.listForRequest(actor!, id), [actor?.id, id]);

  return (
    <>
      <BackLink href="/dashboard/owner/opportunities">Cargo opportunities</BackLink>
      <div className="mt-4">
        <QueryBoundary query={request}>
          {(item) => (
            <>
              <PageHeader
                eyebrow={item.ref}
                title={`${item.pickup.location} to ${item.delivery.location}`}
                subtitle={item.title}
                actions={<StatusBadge family="cargoRequest" status={item.status} />}
              />
              <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(20rem,1fr)]">
                <div className="space-y-5">
                  <CargoInformation item={item} />
                </div>
                <div className="space-y-5">
                  <MyRequestQuotations quotes={mine.data ?? []} loading={mine.data === undefined && !mine.error} />
                  {["OPEN", "QUOTED"].includes(item.status) ? (
                    <QuotationForm request={item} myQuotations={mine.data ?? []} />
                  ) : (
                    <Notice tone="warning" title="This request is not accepting quotations">
                      {item.status === "BOOKED" ? "It has been booked with a quotation." : "It is closed."}{" "}
                      {item.bookingId && mine.data?.some((quote) => quote.status === "ACCEPTED") ? (
                        <Link href={`/dashboard/owner/bookings/${item.bookingId}`} className="font-semibold underline underline-offset-2">Open your booking</Link>
                      ) : null}
                    </Notice>
                  )}
                </div>
              </div>
            </>
          )}
        </QueryBoundary>
      </div>
    </>
  );
}

function CargoInformation({ item }: { item: CargoRequest }) {
  return (
    <>
      <Section title="Cargo information">
        <DetailList
          columns={2}
          items={[
            { label: "Category", value: CATEGORY_LABEL[item.category] },
            { label: "Weight", value: formatTons(item.weightTons) },
            { label: "Volume", value: `${item.volumeM3} m³` },
            { label: "Dimensions (L × W × H)", value: `${item.lengthM} × ${item.widthM} × ${item.heightM} m` },
            { label: "Truck type needed", value: item.truckType },
            { label: "Minimum capacity", value: formatTons(item.minCapacityTons) },
            { label: "Importer budget", value: item.budgetRwf ? formatRwf(item.budgetRwf) : "Not stated" },
            { label: "Handling", value: <FlagChips flags={item.flags} /> },
            { label: "Description", value: <span className="font-normal">{item.description}</span>, wide: true },
          ]}
        />
      </Section>
      <Section title="Route and dates" description="Contact names and phone numbers are shared only after your quotation is accepted and booked.">
        <div className="grid gap-5 sm:grid-cols-2">
          {([["Pickup", item.pickup], ["Delivery", item.delivery]] as const).map(([label, stop]) => (
            <div key={label} className="rounded-xl border border-line bg-background/50 p-4">
              <p className="text-sm font-medium text-muted">{label}</p>
              <p className="mt-1 font-semibold text-navy">{stop.location}</p>
              <p className="text-sm text-muted">{stop.address}</p>
              <p className="mt-2 text-sm font-semibold text-navy">{formatDate(stop.date)}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Loading and handling">
        <DetailList
          columns={1}
          items={[
            { label: "Loading requirements", value: <span className="font-normal">{item.loadingRequirements || "None stated"}</span> },
            { label: "Unloading requirements", value: <span className="font-normal">{item.unloadingRequirements || "None stated"}</span> },
            { label: "Special instructions", value: <span className="font-normal">{item.instructions || "None stated"}</span> },
          ]}
        />
      </Section>
    </>
  );
}

function MyRequestQuotations({ quotes, loading }: { quotes: Quotation[]; loading: boolean }) {
  const { trucks } = useIbanga();
  const { run, busy } = useAction();
  const actor = useActor();
  return (
    <Section title="Your quotations on this request" description="A quotation is not a booking. Only an accepted one becomes a booking.">
      {loading ? (
        <p className="text-sm text-muted">Loading your quotations…</p>
      ) : quotes.length === 0 ? (
        <p className="text-sm text-muted">You have not quoted this request yet.</p>
      ) : (
        <ul className="space-y-3">
          {quotes.map((quote) => {
            const truck = trucks.find((item) => item.id === quote.truckId);
            return (
              <li key={quote.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-navy">{quote.ref} · {formatRwf(quote.amountRwf)}</p>
                  <StatusBadge family="quotation" status={quote.status} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {truck?.plateNumber ?? "Truck"} · pickup {formatDate(quote.estimatedPickupDate)}, delivery {formatDate(quote.estimatedDeliveryDate)} · valid until {formatDate(quote.validUntil)}
                </p>
                {quote.notes ? <p className="mt-1 text-sm text-navy">{quote.notes}</p> : null}
                {quote.status === "SUBMITTED" ? (
                  <div className="mt-3">
                    <ConfirmButton
                      label="Withdraw quotation"
                      title="Withdraw this quotation?"
                      message="The importer will no longer be able to accept this offer."
                      summary={[`${quote.ref} for ${formatRwf(quote.amountRwf)}`, "You can send a new quotation afterwards if the request is still open."]}
                      tone="danger"
                      variant="ghost"
                      disabled={busy}
                      onConfirm={() => (actor ? run(() => services.quotations.withdraw(actor, quote.id), { success: "Quotation withdrawn." }) : undefined)}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
