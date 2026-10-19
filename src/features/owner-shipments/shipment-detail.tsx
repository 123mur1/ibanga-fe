"use client";

import Link from "next/link";
import { QueryBoundary } from "@/components/common/async-state";
import { BackLink, Section } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { ShipmentOverview } from "@/features/shipments/shipment-view";
import { services } from "@/services";
import type { Shipment } from "@/types/ops";
import { DelayForm, MilestonePanel } from "./milestone-panel";

const link =
  "inline-flex items-center justify-center rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-brand/40 hover:bg-brand-soft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

export function OwnerShipmentDetail({ id }: { id: string }) {
  const actor = useActor();
  const query = useServiceQuery(() => services.shipments.get(actor!, id), [actor?.id, id]);
  return (
    <div className="space-y-5">
      <BackLink href="/dashboard/owner/shipments">All shipments</BackLink>
      <QueryBoundary query={query} loadingLabel="Loading shipment">
        {(shipment) => (
          <>
            <PageHeader eyebrow="Shipment" title={shipment.ref} subtitle="Run the trip, record milestones and submit proof of delivery." />
            <ShipmentOverview shipment={shipment} role="TRUCK_OWNER" />
            <OwnerControls shipment={shipment} />
          </>
        )}
      </QueryBoundary>
    </div>
  );
}

function OwnerControls({ shipment }: { shipment: Shipment }) {
  const { incidents, disputeCases } = useOps();
  const evidenceDue = ["ARRIVED", "UNLOADING"].includes(shipment.status) || shipment.evidence?.verification === "REJECTED";
  const openDispute = disputeCases.find((item) => item.bookingId === shipment.bookingId && !["RESOLVED", "REJECTED"].includes(item.status));
  const relatedIncidents = incidents.filter((item) => item.shipmentId === shipment.id);

  return (
    <div className="space-y-5">
      <Section title="Delivery evidence, incidents and disputes">
        <div className="space-y-4">
          {shipment.evidence ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <StatusBadge family="evidence" status={shipment.evidence.verification} />
              {shipment.evidence.verification === "SUBMITTED" ? <span className="text-muted">Submitted, awaiting administrator verification.</span> : null}
              {shipment.evidence.verification === "REJECTED" ? <span className="text-bad">Rejected: {shipment.evidence.rejectionReason ?? "see the evidence page"}</span> : null}
            </div>
          ) : null}
          {shipment.settlementHold ? <Notice tone="warning" title="Settlement on hold">{shipment.settlementHold}</Notice> : null}
          <div className="flex flex-wrap gap-3">
            {evidenceDue ? (
              <Link href={`/dashboard/owner/delivery-evidence/${shipment.id}`} className="inline-flex items-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
                {shipment.evidence?.verification === "REJECTED" ? "Resubmit delivery evidence" : "Submit delivery evidence"}
              </Link>
            ) : shipment.evidence ? (
              <Link href={`/dashboard/owner/delivery-evidence/${shipment.id}`} className={link}>View delivery evidence</Link>
            ) : null}
            <Link href={`/dashboard/owner/incidents/new?shipment=${shipment.id}`} className={link}>Report an incident</Link>
            {openDispute ? (
              <Link href={`/dashboard/owner/disputes/${openDispute.id}`} className={link}>Open dispute {openDispute.ref}</Link>
            ) : (
              <Link href={`/dashboard/owner/disputes/new?booking=${shipment.bookingId}`} className={link}>Open a dispute</Link>
            )}
          </div>
          {relatedIncidents.length ? (
            <ul className="space-y-1 text-sm">
              {relatedIncidents.map((incident) => (
                <li key={incident.id} className="flex items-center gap-2">
                  <Link className="font-semibold text-brand hover:underline" href={`/dashboard/owner/incidents/${incident.id}`}>{incident.ref}</Link>
                  <StatusBadge family="incident" status={incident.status} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Section>
      <MilestonePanel shipment={shipment} />
      <DelayForm shipment={shipment} />
    </div>
  );
}
