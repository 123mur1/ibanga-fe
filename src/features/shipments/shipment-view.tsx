"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { DetailList, Section, Timeline, type TimelineEntry } from "@/components/common/layout-blocks";
import { Notice, SimulationNotice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { useOps } from "@/hooks/use-ops";
import { formatDate, formatDateTime, titleCase } from "@/lib/format";
import { positionAt } from "@/lib/geo";
import { useIbanga } from "@/lib/store";
import type { Role } from "@/lib/types";
import type { MilestoneKind, Shipment, ShipmentStatus } from "@/types/ops";

const TruckMap = dynamic(() => import("@/components/truck-map").then((module) => module.TruckMap), {
  ssr: false,
  loading: () => <div className="h-[26rem] w-full animate-pulse rounded-xl border border-line bg-background" />,
});

/** Rough share of the route covered for each status. Illustrative only, never a measured position. */
const PROGRESS: Record<ShipmentStatus, number> = {
  SCHEDULED: 0,
  PICKUP_CONFIRMED: 0.02,
  LOADED: 0.04,
  DEPARTED: 0.1,
  IN_TRANSIT: 0.5,
  DELAYED: 0.5,
  ARRIVED: 0.97,
  UNLOADING: 0.98,
  DELIVERED: 1,
  COMPLETED: 1,
  CANCELLED: 0,
};

const MILESTONE_TONE: Record<MilestoneKind, TimelineEntry["tone"]> = {
  PICKUP_CONFIRMED: "brand",
  LOADED: "brand",
  DEPARTED: "brand",
  IN_TRANSIT_UPDATE: "brand",
  DELAY: "warning",
  ARRIVED: "success",
  UNLOADING: "brand",
  DELIVERED: "success",
};

const MILESTONE_LABEL: Record<MilestoneKind, string> = {
  PICKUP_CONFIRMED: "Pickup confirmed",
  LOADED: "Cargo loaded",
  DEPARTED: "Departed",
  IN_TRANSIT_UPDATE: "In transit update",
  DELAY: "Delay reported",
  ARRIVED: "Arrived at destination",
  UNLOADING: "Unloading",
  DELIVERED: "Delivery evidence submitted",
};

/** Base path of the role's pages, used for cross-links. */
function base(role: Role) {
  return role === "ADMIN" ? "/dashboard/admin" : role === "TRUCK_OWNER" ? "/dashboard/owner" : role === "DRIVER" ? "/dashboard/driver" : "/dashboard/importer";
}

/**
 * Read-only shipment content shared by importer, owner, driver and administrator pages: status, facts,
 * delay and hold warnings, milestone timeline, demonstration map and delivery evidence.
 * Pages add their own role-specific controls beside it (milestone buttons, evidence form,
 * verification). Submitted evidence is clearly distinguished from verified delivery.
 */
export function ShipmentOverview({ shipment, role }: { shipment: Shipment; role: Role }) {
  const { bookings, trucks, users } = useIbanga();
  const ops = useOps();
  const booking = bookings.find((item) => item.id === shipment.bookingId);
  const truck = trucks.find((item) => item.id === shipment.truckId);
  const driver = ops.drivers.find((item) => item.id === shipment.driverId);
  const owner = users.find((item) => item.id === shipment.ownerId);
  const importer = users.find((item) => item.id === shipment.importerId);
  const dispute = ops.disputeCases.find((item) => item.bookingId === shipment.bookingId && !["RESOLVED", "REJECTED"].includes(item.status));
  const incident = ops.incidents.find((item) => item.shipmentId === shipment.id && !["RESOLVED", "CLOSED"].includes(item.status));
  const evidence = shipment.evidence;

  const from = booking?.pickupLocation ?? "Origin";
  const to = booking?.destination ?? "Destination";
  const route = positionAt(from, to, 0);

  const entries: TimelineEntry[] = [...shipment.milestones]
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((milestone) => ({
      id: milestone.id,
      title: `${MILESTONE_LABEL[milestone.kind]} · ${milestone.place}`,
      detail: milestone.note,
      at: formatDateTime(milestone.at),
      tone: MILESTONE_TONE[milestone.kind],
      simulated: milestone.simulated,
    }));

  const links = [
    booking && role !== "DRIVER" ? { href: `${base(role)}/bookings/${booking.id}`, label: "Booking" } : null,
    booking?.payment && role !== "TRUCK_OWNER" && role !== "DRIVER" ? { href: `${base(role)}/payments/${booking.id}`, label: "Payment" } : null,
    dispute && role !== "DRIVER" ? { href: `${base(role)}/disputes/${dispute.id}`, label: `Dispute ${dispute.ref}` } : null,
    incident && (role === "TRUCK_OWNER" || role === "ADMIN") ? { href: `${base(role)}/incidents/${incident.id}`, label: `Incident ${incident.ref}` } : null,
  ].filter((item): item is { href: string; label: string } => Boolean(item));

  return (
    <div className="space-y-5">
      {shipment.status === "DELAYED" && shipment.delay ? (
        <Notice tone="warning" title={`Delayed: ${shipment.delay.reason}`}>
          New estimated delivery {formatDate(shipment.delay.newEtaDate)}. Reported {formatDateTime(shipment.delay.reportedAt)}.
        </Notice>
      ) : null}
      {dispute ? (
        <Notice tone="danger" title={`Disputed (${dispute.ref})`} action={role === "DRIVER" ? undefined : { href: `${base(role)}/disputes/${dispute.id}`, label: "Open dispute" }}>
          This shipment has an open dispute. The owner&apos;s settlement is on hold until it is resolved.
        </Notice>
      ) : incident && (role === "TRUCK_OWNER" || role === "ADMIN") ? (
        <Notice tone="warning" title={`Open incident (${incident.ref})`} action={{ href: `${base(role)}/incidents/${incident.id}`, label: "Open incident" }}>
          An unresolved incident holds this shipment&apos;s settlement.
        </Notice>
      ) : null}

      <Section title="Shipment details" actions={<StatusBadge family="shipment" status={shipment.status} />}>
        <DetailList
          items={[
            { label: "Shipment", value: shipment.ref },
            { label: "Route", value: `${from} to ${to}` },
            { label: "Cargo", value: booking ? `${booking.cargoType} · ${booking.cargoWeight}` : "—" },
            { label: "Estimated delivery", value: formatDate(shipment.etaDate) },
            { label: "Truck", value: truck ? `${truck.plateNumber} · ${truck.truckType}` : "—" },
            { label: "Driver", value: driver ? `${driver.name} · ${driver.phone}` : "Not assigned yet" },
            ...(role !== "TRUCK_OWNER" ? [{ label: "Truck owner", value: owner?.company ?? owner?.name ?? "—" }] : []),
            ...(role !== "IMPORTER" ? [{ label: "Importer", value: importer?.company ?? importer?.name ?? "—" }] : []),
            { label: "Pickup date", value: formatDate(booking?.pickupDate) },
            { label: "Booking", value: booking?.id ?? "—" },
          ]}
        />
        {links.length ? (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-4 text-sm font-semibold">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-brand hover:text-brand-dark">{link.label}</Link>
            ))}
          </div>
        ) : null}
      </Section>

      <Section title="Map" description={`${from} to ${to} · about ${route.totalKm} km in a straight line`}>
        <SimulationNotice kind="tracking" />
        <div className="mt-4">
          <TruckMap pickup={from} destination={to} progress={PROGRESS[shipment.status]} moving={false} />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          The marker shows an illustrative position based on the latest milestone. Live GPS tracking is planned and not connected.
        </p>
      </Section>

      <Section title="Milestones" description="Newest entries are added at the bottom.">
        <Timeline entries={entries} empty="No milestones recorded yet. The trip has not started." />
      </Section>

      <Section
        title="Proof of delivery"
        actions={evidence ? <StatusBadge family="evidence" status={evidence.verification} /> : undefined}
      >
        {!evidence ? (
          <p className="text-sm text-muted">No delivery evidence has been submitted. Delivery is not complete until evidence is submitted and verified.</p>
        ) : (
          <div className="space-y-5">
            {evidence.verification === "SUBMITTED" ? (
              <Notice tone="warning" title="Submitted, not yet verified">
                The driver submitted this evidence {formatDateTime(evidence.submittedAt)}. It counts as delivered only after an administrator verifies it.
              </Notice>
            ) : evidence.verification === "VERIFIED" ? (
              <Notice tone="success" title="Delivery verified">
                Verified {formatDateTime(evidence.verifiedAt)}.
              </Notice>
            ) : (
              <Notice tone="danger" title="Evidence rejected">
                {evidence.rejectionReason ?? "The evidence was rejected."} The truck owner must resubmit.
              </Notice>
            )}
            <DetailList
              items={[
                { label: "Recipient", value: evidence.recipientName },
                { label: "Delivered", value: formatDateTime(evidence.deliveredAt) },
                { label: "Confirmation code", value: evidence.confirmationCode },
                { label: "Damage reported", value: evidence.damageReported ? "Yes" : "No" },
                { label: "Shortage reported", value: evidence.shortageReported ? "Yes" : "No" },
                { label: "Submitted by", value: users.find((user) => user.id === evidence.submittedBy)?.name ?? "—" },
                { label: "Notes", value: evidence.notes || "—", wide: true },
              ]}
            />
            {evidence.photos.length || evidence.signatureDataUrl ? (
              <ul className="grid gap-3 sm:grid-cols-3">
                {evidence.photos.map((photo, index) => (
                  <li key={index} className="overflow-hidden rounded-lg border border-line bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt={`Delivery evidence ${index + 1}`} className="h-32 w-full object-cover" />
                  </li>
                ))}
                {evidence.signatureDataUrl ? (
                  <li className="overflow-hidden rounded-lg border border-line bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={evidence.signatureDataUrl} alt="Recipient signature" className="h-32 w-full object-contain" />
                    <p className="border-t border-line px-2 py-1 text-center text-[11px] text-muted">Recipient signature</p>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
        )}
      </Section>

      <p className="text-xs text-muted">Status: {titleCase(shipment.status)} · Reference {shipment.ref}</p>
    </div>
  );
}
