"use client";

import Link from "next/link";
import { useState } from "react";
import { DetailList, Section, Timeline, type TimelineEntry } from "@/components/common/layout-blocks";
import { ConfirmButton } from "@/components/common/confirm-button";
import { controlClass, FormField } from "@/components/common/form-fields";
import { Notice } from "@/components/common/notices";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { formatDate, formatDateTime, formatRwf, formatTons } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { CargoRequest, Quotation } from "@/types/ops";
import { CATEGORY_LABEL } from "./booking-from-quotation";
import { CANCEL_REQUEST_MIN_REASON } from "./schemas";

const FLAG_LABEL: Record<CargoRequest["flags"][number], string> = {
  FRAGILE: "Fragile",
  HAZARDOUS: "Hazardous",
  PERISHABLE: "Perishable",
  SPECIAL_HANDLING: "Special handling",
};

const dimensions = (request: CargoRequest) => `${request.lengthM} × ${request.widthM} × ${request.heightM} m`;

export function CargoRequestDetails({ request }: { request: CargoRequest }) {
  const { pickup, delivery } = request;
  return (
    <div className="space-y-5">
      <Section title="Cargo">
        <DetailList
          items={[
            { label: "Reference", value: request.ref },
            { label: "Category", value: CATEGORY_LABEL[request.category] },
            { label: "Weight", value: formatTons(request.weightTons) },
            { label: "Volume", value: `${request.volumeM3} m³` },
            { label: "Dimensions (L × W × H)", value: dimensions(request) },
            { label: "Estimated value", value: formatRwf(request.valueRwf) },
            { label: "Required truck", value: `${request.truckType}, at least ${formatTons(request.minCapacityTons)}` },
            { label: "Expected budget", value: request.budgetRwf ? formatRwf(request.budgetRwf) : "Not set" },
            { label: "Handling", value: request.flags.length ? request.flags.map((flag) => FLAG_LABEL[flag]).join(", ") : "Standard" },
            { label: "Description", value: request.description || "—", wide: true },
          ]}
        />
      </Section>
      <div className="grid gap-5 lg:grid-cols-2">
        {[{ title: "Pickup", stop: pickup }, { title: "Destination", stop: delivery }].map(({ title, stop }) => (
          <Section key={title} title={title}>
            <DetailList
              columns={1}
              items={[
                { label: "Location", value: stop.location || "—" },
                { label: "Address", value: stop.address || "—" },
                { label: "Date", value: formatDate(stop.date) },
                { label: "Contact", value: stop.contactName ? `${stop.contactName} · ${stop.contactPhone}` : "—" },
              ]}
            />
          </Section>
        ))}
      </div>
      <Section title="Handling and attachments">
        <DetailList
          items={[
            { label: "Loading requirements", value: request.loadingRequirements || "—" },
            { label: "Unloading requirements", value: request.unloadingRequirements || "—" },
            { label: "Additional instructions", value: request.instructions || "—", wide: true },
            { label: "Documents", value: request.documentNames.length ? request.documentNames.join(", ") : "None attached", wide: true },
          ]}
        />
        {request.photos.length ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {request.photos.map((photo, index) => (
              <li key={index} className="overflow-hidden rounded-lg border border-line bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt={`Cargo photo ${index + 1}`} className="h-32 w-full object-cover" />
              </li>
            ))}
          </ul>
        ) : null}
      </Section>
    </div>
  );
}

/** Built from the record itself: creation, quotations received, then the outcome. */
export function CargoRequestHistory({ request, quotations }: { request: CargoRequest; quotations: Quotation[] }) {
  const entries: (TimelineEntry & { sort: string })[] = [
    { id: "created", sort: request.createdAt, title: request.status === "DRAFT" ? "Draft saved" : "Request created", at: formatDateTime(request.createdAt), tone: "brand" },
    ...quotations.map((quote) => ({
      id: quote.id,
      sort: quote.createdAt,
      title: `Quotation ${quote.ref} received`,
      detail: `${formatRwf(quote.amountRwf)} · ${quote.status === "ACCEPTED" ? "accepted" : quote.status === "SUBMITTED" ? "awaiting your decision" : quote.status === "REJECTED" ? "not selected" : quote.status.toLowerCase()}`,
      at: formatDateTime(quote.createdAt),
      tone: quote.status === "ACCEPTED" ? ("success" as const) : ("neutral" as const),
    })),
  ];
  if (request.status === "BOOKED") entries.push({ id: "booked", sort: request.updatedAt, title: "Booked", detail: request.bookingId ? `Booking ${request.bookingId}` : undefined, at: formatDateTime(request.updatedAt), tone: "success" });
  if (request.status === "CANCELLED") entries.push({ id: "cancelled", sort: request.updatedAt, title: "Request cancelled", detail: request.cancelledReason, at: formatDateTime(request.updatedAt), tone: "danger" });
  if (request.status === "EXPIRED") entries.push({ id: "expired", sort: request.updatedAt, title: "Request expired", at: formatDateTime(request.updatedAt), tone: "neutral" });
  entries.sort((a, b) => a.sort.localeCompare(b.sort));
  return <Timeline entries={entries} />;
}

/** Cancel a draft, open or quoted request. A reason is required. */
export function CancelRequestPanel({ request }: { request: CargoRequest }) {
  const actor = useActor();
  const { run, busy } = useAction();
  const [reason, setReason] = useState("");
  const valid = reason.trim().length >= CANCEL_REQUEST_MIN_REASON;

  return (
    <Section title="Cancel this request" description="Stops new quotations. Owners who already quoted are told the request closed.">
      <FormField label="Reason" required hint="Required. This is shared with the quoting owners.">
        <textarea className={`${controlClass} min-h-20`} value={reason} onChange={(event) => setReason(event.target.value)} />
      </FormField>
      <div className="mt-4">
        <ConfirmButton
          label="Cancel request"
          title="Cancel this cargo request?"
          message="This cannot be undone."
          summary={["Open quotations are closed.", "No booking exists yet, so no money is involved.", `Reason: ${reason.trim()}`]}
          confirmLabel="Yes, cancel request"
          tone="danger"
          variant="ghost"
          disabled={!valid || busy || !actor}
          onConfirm={() => run(() => services.cargoRequests.cancel(actor!, request.id, reason.trim()), { success: "Request cancelled." })}
        />
        {!valid ? <p className="mt-2 text-xs text-muted">Enter a reason to enable cancelling.</p> : null}
      </div>
    </Section>
  );
}

export function BookedPanel({ bookingId }: { bookingId: string }) {
  const { bookings } = useIbanga();
  const paid = Boolean(bookings.find((item) => item.id === bookingId)?.payment);
  return (
    <Notice tone="success" title="Booked">
      <p>
        Your quotation was accepted and the booking is confirmed.{" "}
        {paid ? "Payment is recorded." : <strong>Payment has NOT been made yet. Open the booking to pay and secure the truck.</strong>}
      </p>
      <p className="mt-2 flex flex-wrap gap-4 font-semibold">
        <Link className="underline underline-offset-2" href={`/dashboard/importer/bookings/${bookingId}`}>{paid ? "Open booking" : "Open booking and pay"}</Link>
        <Link className="underline underline-offset-2" href={paid ? `/dashboard/importer/payments/${bookingId}` : "/dashboard/importer/payments"}>{paid ? "Payment details" : "My payments"}</Link>
        <Link className="underline underline-offset-2" href="/dashboard/importer/shipments">My shipments</Link>
      </p>
    </Notice>
  );
}
