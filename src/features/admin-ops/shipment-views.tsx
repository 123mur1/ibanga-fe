"use client";

import { QueryBoundary } from "@/components/common/async-state";
import { controlClass, FormField } from "@/components/common/form-fields";
import { Notice, SimulationNotice } from "@/components/common/notices";
import { Section, StatGrid } from "@/components/common/layout-blocks";
import { StatusBadge } from "@/components/common/status-badge";
import { evaluateSettlement } from "@/config/business-rules";
import { DataTable, PrimaryButton, StatCard, ViewLink } from "@/components/ui";
import { ShipmentOverview } from "@/features/shipments/shipment-view";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { applyFieldErrors, useZodForm } from "@/lib/forms";
import { formatDate, titleCase } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { Shipment } from "@/types/ops";
import { MILESTONE_KINDS, milestoneSchema } from "./schemas";
import { ReasonReview } from "./reason-review";
import { TextLink, useAdminLookups } from "./use-admin";

export function ShipmentList() {
  const actor = useActor();
  const ops = useOps();
  const { bookings } = useIbanga();
  const { userName, truckLabel } = useAdminLookups();
  const query = useServiceQuery(() => services.shipments.list(actor!, { pageSize: 500 }), [actor?.id]);

  return (
    <div className="mt-6 space-y-5">
      <SimulationNotice kind="tracking" />
      <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0} empty={{ title: "No shipments yet", text: "A shipment is created when a booking is confirmed." }}>
        {(data) => {
          const moving = data.items.filter((item) => ["PICKUP_CONFIRMED", "LOADED", "DEPARTED", "IN_TRANSIT", "ARRIVED", "UNLOADING"].includes(item.status)).length;
          const delayed = data.items.filter((item) => item.status === "DELAYED").length;
          const toVerify = data.items.filter((item) => item.evidence?.verification === "SUBMITTED").length;
          return (
            <>
              <StatGrid>
                <StatCard label="Shipments" value={data.total} hint="All owners" />
                <StatCard label="In progress" value={moving} hint="Picked up, not delivered" accent="accent" />
                <StatCard label="Delayed" value={delayed} hint="Owner reported a delay" accent="warn" />
                <StatCard label="Evidence to verify" value={toVerify} hint="Delivery not yet verified" accent="bad" />
              </StatGrid>
              <DataTable
                columns={[{ label: "Shipment" }, { label: "Route" }, { label: "Owner" }, { label: "Truck" }, { label: "Associated driver" }, { label: "ETA" }, { label: "Status" }, { label: "Delivery" }, { label: "Actions", className: "text-right" }]}
                filterLabel="All statuses"
                extraFilterLabel="All delivery states"
                exportName="ibanga-admin-shipments"
                emptyMessage="No shipments match."
                rows={data.items.map((item) => {
                  const booking = bookings.find((entry) => entry.id === item.bookingId);
                  const route = booking ? `${booking.pickupLocation} to ${booking.destination}` : item.bookingId;
                  const assignment = ops.driverAssignments.find((entry) => entry.shipmentId === item.id && entry.status === "ACTIVE") ?? ops.driverAssignments.find((entry) => entry.shipmentId === item.id && entry.status === "UPCOMING");
                  const driver = ops.drivers.find((entry) => entry.id === item.driverId) ?? ops.drivers.find((entry) => entry.id === assignment?.driverId);
                  const held = Boolean(item.settlementHold) || ops.disputeCases.some((entry) => entry.bookingId === item.bookingId && !["RESOLVED", "REJECTED"].includes(entry.status));
                  return {
                    id: item.id,
                    searchText: `${item.ref} ${route} ${userName(item.ownerId)} ${userName(item.importerId)} ${truckLabel(item.truckId)} ${driver?.name ?? ""}`,
                    filterValue: item.status,
                    extraFilterValue: item.evidence?.verification ?? "NO_EVIDENCE",
                    exportValues: [item.ref, route, userName(item.ownerId), truckLabel(item.truckId), driver?.name ?? "Unassigned", formatDate(item.etaDate), item.status, item.evidence?.verification ?? "NO_EVIDENCE", ""],
                    cells: [
                      <span key="r"><strong className="block">{item.ref}</strong><span className="text-xs text-muted">{held ? "Settlement on hold" : `Booking ${item.bookingId}`}</span></span>,
                      route,
                      userName(item.ownerId),
                      truckLabel(item.truckId),
                      driver?.name ?? <span key="d" className="text-muted">Unassigned</span>,
                      formatDate(item.etaDate),
                      <StatusBadge key="s" family="shipment" status={item.status} />,
                      item.evidence ? <StatusBadge key="e" family="evidence" status={item.evidence.verification} /> : <span key="e" className="text-sm text-muted">No evidence</span>,
                      <div key="a" className="flex justify-end"><ViewLink href={`/dashboard/admin/shipments/${item.id}`} label={`View shipment ${item.ref}`} /></div>,
                    ],
                  };
                })}
              />
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}

function VerifyDelivery({ shipment }: { shipment: Shipment }) {
  const actor = useActor();
  const ops = useOps();
  const { bookings } = useIbanga();
  const { run, busy } = useAction();
  const booking = bookings.find((item) => item.id === shipment.bookingId);
  const evidence = shipment.evidence;
  if (!booking) return <p className="text-sm text-muted">The booking for this shipment could not be found.</p>;

  const openDispute = ops.disputeCases.some((item) => item.bookingId === shipment.bookingId && !["RESOLVED", "REJECTED"].includes(item.status));
  const openIncident = ops.incidents.some((item) => item.shipmentId === shipment.id && !["RESOLVED", "CLOSED"].includes(item.status));
  const now = evaluateSettlement({ booking, shipment, openDispute, openIncident });
  const ifVerified = evidence ? evaluateSettlement({ booking, shipment: { ...shipment, evidence: { ...evidence, verification: "VERIFIED" } }, openDispute, openIncident }) : undefined;
  const ifRejected = evidence ? evaluateSettlement({ booking, shipment: { ...shipment, evidence: { ...evidence, verification: "REJECTED" } }, openDispute, openIncident }) : undefined;

  if (!evidence) {
    return <Notice tone="info" title="No evidence to verify">The owner has not submitted proof of delivery. The settlement is {titleCase(now.status)}: {now.reasons.join(" ")}</Notice>;
  }
  if (evidence.verification !== "SUBMITTED") {
    return (
      <Notice tone={evidence.verification === "VERIFIED" ? "success" : "warning"} title={evidence.verification === "VERIFIED" ? "Delivery already verified" : "Evidence was rejected"}>
        Settlement status now: {titleCase(now.status)}. {now.reasons.join(" ")}
      </Notice>
    );
  }
  return (
    <div className="space-y-4">
      <SimulationNotice kind="settlement" />
      <div className="grid gap-3 sm:grid-cols-3 text-sm">
        <div className="rounded-xl border border-line p-3"><p className="text-muted">Settlement now</p><StatusBadge family="settlement" status={now.status} /></div>
        <div className="rounded-xl border border-good/30 p-3"><p className="text-muted">If verified</p><StatusBadge family="settlement" status={ifVerified!.status} /><p className="mt-1 text-xs text-muted">{ifVerified!.reasons.join(" ")}</p></div>
        <div className="rounded-xl border border-bad/30 p-3"><p className="text-muted">If rejected</p><StatusBadge family="settlement" status={ifRejected!.status} /><p className="mt-1 text-xs text-muted">{ifRejected!.reasons.join(" ")}</p></div>
      </div>
      {(openDispute || openIncident) ? <Notice tone="warning" title="A hold applies">Verifying delivery does not release the settlement while the {openDispute ? "dispute" : "incident"} is open.</Notice> : null}
      <ReasonReview
        disabled={busy}
        approve={{
          label: "Verify delivery",
          title: "Verify this delivery?",
          message: "You confirm the evidence proves the cargo was delivered.",
          summary: [`Settlement moves to: ${titleCase(ifVerified!.status)}`, "No money moves until a settlement is approved separately"],
        }}
        reject={{
          label: "Reject evidence",
          title: "Reject this evidence?",
          message: "The owner must resubmit proof of delivery.",
          summary: ["Delivery stays unverified", `Settlement: ${titleCase(ifRejected!.status)}`],
        }}
        onApprove={() => run(() => services.shipments.reviewEvidence(actor!, shipment.id, { approve: true }), { success: "Delivery verified." })}
        onReject={(reason) => run(() => services.shipments.reviewEvidence(actor!, shipment.id, { approve: false, reason }), { success: "Evidence rejected." })}
      />
    </div>
  );
}

function MilestoneCorrection({ shipment }: { shipment: Shipment }) {
  const actor = useActor();
  const { run, busy } = useAction();
  const form = useZodForm(milestoneSchema, { defaultValues: { kind: "IN_TRANSIT_UPDATE", place: "", note: "" } });
  const { register, handleSubmit, setError, reset, formState } = form;
  const closed = ["DELIVERED", "COMPLETED", "CANCELLED"].includes(shipment.status);

  const submit = handleSubmit(async (values) => {
    const result = await run(() => services.shipments.recordMilestone(actor!, shipment.id, values), {
      success: "Milestone recorded.",
      onError: (_error, fields) => applyFieldErrors(setError, fields),
    });
    if (result) reset({ kind: values.kind, place: "", note: "" });
  });

  if (closed) return <p className="text-sm text-muted">This shipment is {titleCase(shipment.status)}; milestones can no longer be corrected.</p>;
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Milestone" required error={formState.errors.kind?.message}>
          <select className={controlClass} {...register("kind")} disabled={busy}>
            {MILESTONE_KINDS.map((kind) => <option key={kind} value={kind}>{titleCase(kind)}</option>)}
          </select>
        </FormField>
        <FormField label="Place" required error={formState.errors.place?.message}>
          <input className={controlClass} {...register("place")} disabled={busy} aria-invalid={Boolean(formState.errors.place)} />
        </FormField>
        <FormField label="Note" error={formState.errors.note?.message}>
          <input className={controlClass} {...register("note")} disabled={busy} aria-invalid={Boolean(formState.errors.note)} />
        </FormField>
      </div>
      <PrimaryButton type="submit" disabled={busy}>{busy ? "Recording…" : "Record milestone"}</PrimaryButton>
    </form>
  );
}

function ShipmentLinks({ shipment }: { shipment: Shipment }) {
  const ops = useOps();
  const settlement = ops.settlements.find((item) => item.bookingId === shipment.bookingId);
  const dispute = ops.disputeCases.find((item) => item.bookingId === shipment.bookingId);
  const incidents = ops.incidents.filter((item) => item.shipmentId === shipment.id);
  const none = !settlement && !dispute && !incidents.length;
  return (
    <ul className="space-y-2 text-sm">
      {settlement ? <li><TextLink href={`/dashboard/admin/settlements/${settlement.id}`}>Settlement {settlement.ref}</TextLink> <StatusBadge family="settlement" status={settlement.status} /></li> : null}
      {dispute ? <li><TextLink href={`/dashboard/admin/disputes/${dispute.id}`}>Dispute {dispute.ref}</TextLink> <StatusBadge family="dispute" status={dispute.status} /></li> : null}
      {incidents.map((item) => <li key={item.id}><TextLink href={`/dashboard/admin/incidents/${item.id}`}>Incident {item.ref}</TextLink> <StatusBadge family="incident" status={item.status} /></li>)}
      {none ? <li className="text-muted">No settlement, dispute or incident is linked yet.</li> : null}
    </ul>
  );
}

export function AdminShipmentDetail({ id }: { id: string }) {
  const actor = useActor();
  const query = useServiceQuery(() => services.shipments.get(actor!, id), [actor?.id, id]);
  return (
    <div className="mt-6">
      <QueryBoundary query={query}>
        {(shipment) => (
          <div className="space-y-5">
            <ShipmentOverview shipment={shipment} role="ADMIN" />
            <Section title="Verify delivery" description="Submitted evidence is not verified delivery until you verify it.">
              <VerifyDelivery shipment={shipment} />
            </Section>
            <Section title="Milestone correction" description="Administrator correction.">
              <MilestoneCorrection shipment={shipment} />
            </Section>
            <Section title="Related records">
              <ShipmentLinks shipment={shipment} />
            </Section>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
