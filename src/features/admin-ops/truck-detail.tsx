"use client";

import { useState } from "react";
import { ConfirmButton } from "@/components/common/confirm-button";
import { controlClass, FormField } from "@/components/common/form-fields";
import { DetailList, Section } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { truckEligibility } from "@/config/business-rules";
import { STATUS_DEFS } from "@/config/status";
import { TruckBadge, BookingBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { formatDate, formatPercent, formatTons, titleCase } from "@/lib/format";
import { formatRwf } from "@/lib/payments";
import { useIbanga } from "@/lib/store";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/types";
import { services } from "@/services";
import type { TruckOpsStatus } from "@/types/ops";
import { DocumentList } from "./document-list";
import { EligibilityNotice } from "./eligibility-card";
import { TextLink } from "./use-admin";

const OPS_STATUSES = Object.keys(STATUS_DEFS.truckOps) as TruckOpsStatus[];

export function AdminTruckDetail({ id }: { id: string }) {
  const actor = useActor();
  const ops = useOps();
  const { trucks, bookings, users, setAvailability } = useIbanga();
  const { run, busy } = useAction();
  const [pending, setPending] = useState<TruckOpsStatus | "">("");

  const truck = trucks.find((item) => item.id === id);
  if (!truck) {
    return <div className="mt-6"><EmptyState title="Truck not found" text="This truck does not exist or was removed." /></div>;
  }
  const profile = ops.truckProfiles.find((item) => item.truckId === truck.id);
  const documents = ops.documents.filter((doc) => doc.subjectKind === "TRUCK" && doc.subjectId === truck.id);
  const eligibility = truckEligibility(profile, ops.documents);
  const owner = users.find((item) => item.id === truck.ownerId);
  const truckBookings = bookings.filter((item) => item.truckId === truck.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const onActiveBooking = truckBookings.some((item) => ACTIVE_BOOKING_STATUSES.includes(item.status));
  const enabled = truck.status === "AVAILABLE";
  const nextOps = pending || profile?.opsStatus || "AVAILABLE";

  async function toggleListing() {
    await run(
      async () => {
        const error = await setAvailability(truck!.id, enabled ? "UNAVAILABLE" : "AVAILABLE");
        if (error) throw new Error(error);
      },
      { success: enabled ? "Listing disabled." : "Listing enabled." },
    );
  }

  return (
    <div className="mt-6 space-y-5">
      <EligibilityNotice subject={truck.plateNumber} result={eligibility} />

      <Section title="Marketplace listing" actions={<TruckBadge status={truck.status} />}>
        <DetailList
          items={[
            { label: "Plate number", value: truck.plateNumber },
            { label: "Type", value: truck.truckType },
            { label: "Capacity", value: formatTons(truck.capacity) },
            { label: "Price", value: truck.priceRwf ? formatRwf(truck.priceRwf) : "Quoted per request" },
            { label: "Current location", value: truck.currentLocation },
            { label: "Preferred route", value: truck.preferredRoute },
            { label: "Owner", value: owner ? owner.company ?? owner.name : "—" },
            { label: "Description", value: truck.description || "—", wide: true },
          ]}
        />
      </Section>

      <Section title="Operations profile" description="Demonstration figures." actions={profile ? <StatusBadge family="truckOps" status={profile.opsStatus} /> : undefined}>
        {profile ? (
          <DetailList
            columns={3}
            items={[
              { label: "Verification", value: <StatusBadge family="verification" status={profile.verification} /> },
              { label: "Dimensions", value: `${profile.lengthM} x ${profile.widthM} x ${profile.heightM} m (${profile.volumeM3} m³)` },
              { label: "Suitable for", value: profile.suitability.length ? profile.suitability.map(titleCase).join(", ") : "—" },
              { label: "Trips completed", value: profile.tripsCompleted },
              { label: "On-time rate", value: formatPercent(profile.onTimeRate) },
              { label: "Utilisation (30 days)", value: formatPercent(profile.utilizationPct) },
            ]}
          />
        ) : (
          <p className="text-sm text-muted">No operations profile exists for this truck yet.</p>
        )}
      </Section>

      <Section title="Documents" description="Vehicle registration, inspection and insurance are required to take work.">
        <DocumentList documents={documents} />
        <div className="mt-4"><TextLink href="/dashboard/admin/verifications">Open verification requests</TextLink></div>
      </Section>

      <Section title="Bookings on this truck" description={`${truckBookings.length} on record`}>
        {truckBookings.length ? (
          <ul className="divide-y divide-line text-sm">
            {truckBookings.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span>
                  <TextLink href={`/dashboard/admin/bookings/${item.id}`}>{item.pickupLocation} to {item.destination}</TextLink>
                  <span className="block text-xs text-muted">Pickup {formatDate(item.pickupDate)} · {item.cargoType}</span>
                </span>
                <BookingBadge status={item.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No bookings yet.</p>
        )}
      </Section>

      <Section title="Controlled actions" description="Changes are recorded in the audit log. The backend must enforce them on every request.">
        <div className="space-y-6">
          {profile ? (
            <div className="grid gap-3 sm:grid-cols-[minmax(0,16rem)_auto] sm:items-end">
              <FormField label="Operational status">
                <select className={controlClass} value={nextOps} disabled={busy} onChange={(event) => setPending(event.target.value as TruckOpsStatus)}>
                  {OPS_STATUSES.map((status) => (
                    <option key={status} value={status}>{STATUS_DEFS.truckOps[status].label}</option>
                  ))}
                </select>
              </FormField>
              <ConfirmButton
                label="Update status"
                title={`Set ${truck.plateNumber} to ${STATUS_DEFS.truckOps[nextOps].label}?`}
                message="This changes whether the truck can take new work."
                summary={nextOps === "MAINTENANCE" || nextOps === "INACTIVE" ? ["The truck will be treated as not in service and ineligible to quote"] : ["Eligibility is recalculated from documents and verification"]}
                disabled={busy || nextOps === profile.opsStatus}
                onConfirm={async () => {
                  await run(() => services.trucks.setOpsStatus(actor!, truck.id, nextOps), { success: "Operational status updated." });
                  setPending("");
                }}
              />
            </div>
          ) : null}
          <div>
            {onActiveBooking && enabled ? <div className="mb-3"><Notice tone="warning" title="Truck has an active booking">Disabling the listing does not cancel the booking. It only hides the truck from new bookings.</Notice></div> : null}
            <ConfirmButton
              label={enabled ? "Disable listing" : "Enable listing"}
              title={enabled ? `Disable ${truck.plateNumber}?` : `Enable ${truck.plateNumber}?`}
              message={enabled ? "Importers will no longer be able to book this truck." : "The truck becomes available to book again."}
              summary={enabled ? ["Marketplace status becomes Unavailable", "Existing bookings are not changed"] : ["Marketplace status becomes Available"]}
              tone={enabled ? "danger" : "brand"}
              variant="ghost"
              disabled={busy || (!enabled && onActiveBooking)}
              onConfirm={toggleListing}
            />
            {!enabled && onActiveBooking ? <p className="mt-2 text-xs text-muted">The listing cannot be enabled while the truck is on an active booking.</p> : null}
          </div>
        </div>
      </Section>
    </div>
  );
}
