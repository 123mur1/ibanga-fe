"use client";

import Link from "next/link";
import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { ConfirmButton } from "@/components/common/confirm-button";
import { controlClass } from "@/components/common/form-fields";
import { Section } from "@/components/common/layout-blocks";
import { StatusBadge } from "@/components/common/status-badge";
import { driverEligibility } from "@/config/business-rules";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { Driver, DriverAssignment } from "@/types/ops";
import { AssignForm } from "./assign-form";

/** Upcoming, active and past assignments for one driver, plus the assign form. */
export function AssignmentsPanel({ driver }: { driver: Driver }) {
  const actor = useActor();
  const query = useServiceQuery(() => services.drivers.listAssignments(actor!, { driverId: driver.id }), [actor?.id, driver.id]);

  return (
    <>
      <Section title="Assignments" description="Trips and truck assignments for this driver.">
        <QueryBoundary query={query} isEmpty={(items) => items.length === 0} empty={{ title: "No assignments", text: "Assign this driver to a truck below." }}>
          {(items) => (
            <div className="space-y-5">
              {(["ACTIVE", "UPCOMING", "COMPLETED", "CANCELLED"] as const).map((status) => {
                const group = items.filter((item) => item.status === status).sort((a, b) => b.startDate.localeCompare(a.startDate));
                if (!group.length) return null;
                return (
                  <div key={status}>
                    <h3 className="mb-2 text-sm font-semibold text-navy">{status === "ACTIVE" ? "Active" : status === "UPCOMING" ? "Upcoming" : status === "COMPLETED" ? "History: completed" : "History: cancelled"}</h3>
                    <ul className="space-y-2">
                      {group.map((item) => <AssignmentRow key={item.id} assignment={item} driver={driver} />)}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </QueryBoundary>
      </Section>
      <AssignForm driver={driver} />
    </>
  );
}

function AssignmentRow({ assignment, driver }: { assignment: DriverAssignment; driver: Driver }) {
  const actor = useActor();
  const ops = useOps();
  const { trucks } = useIbanga();
  const { run, busy } = useAction();
  const [replacement, setReplacement] = useState("");

  const truck = trucks.find((item) => item.id === assignment.truckId);
  const open = assignment.status === "ACTIVE" || assignment.status === "UPCOMING";
  const candidates = ops.drivers.filter((item) => item.ownerId === actor?.id && item.id !== driver.id);
  const chosen = candidates.find((item) => item.id === replacement);
  const check = chosen ? driverEligibility(chosen, ops.documents) : undefined;

  return (
    <li className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-navy">{truck?.plateNumber ?? "Truck"} · {formatDate(assignment.startDate)} to {formatDate(assignment.endDate)}</p>
        <StatusBadge family="assignment" status={assignment.status} />
      </div>
      <p className="mt-1 text-sm text-muted">
        {assignment.bookingId ? (
          <Link href={`/dashboard/owner/bookings/${assignment.bookingId}`} className="font-semibold text-brand hover:text-brand-dark">View booking</Link>
        ) : "Not linked to a booking"}
        {assignment.shipmentId ? <> · <Link href={`/dashboard/owner/shipments/${assignment.shipmentId}`} className="font-semibold text-brand hover:text-brand-dark">View shipment</Link></> : null}
        {assignment.replacedDriverId ? " · replaced a previous driver" : ""}
      </p>
      {open ? (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block min-w-48 flex-1 text-sm font-medium text-navy">
            Change driver
            <select className={`${controlClass} mt-1.5`} value={replacement} onChange={(event) => setReplacement(event.target.value)}>
              <option value="">Choose a replacement driver</option>
              {candidates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <ConfirmButton
            label="Change driver"
            title={assignment.status === "ACTIVE" ? "Change the driver on an active trip?" : "Change the driver?"}
            message={`${driver.name} will be replaced${chosen ? ` by ${chosen.name}` : ""}.`}
            summary={[
              assignment.status === "ACTIVE" ? "The trip is in progress. Importers are notified of the change." : "The new driver takes over this assignment.",
              `${driver.name} becomes available again.`,
            ]}
            variant="ghost"
            disabled={busy || !chosen || Boolean(check && !check.eligible)}
            onConfirm={() => (actor ? run(() => services.drivers.reassign(actor, assignment.id, replacement), { success: "Driver changed." }).then(() => setReplacement("")) : undefined)}
          />
          <ConfirmButton
            label="Cancel assignment"
            title="Cancel this assignment?"
            message="The driver is released from this truck and these dates."
            summary={["The booking and shipment are not cancelled by this action."]}
            tone="danger"
            variant="ghost"
            disabled={busy}
            onConfirm={() => (actor ? run(() => services.drivers.cancelAssignment(actor, assignment.id), { success: "Assignment cancelled." }) : undefined)}
          />
          {check && !check.eligible ? <p role="alert" className="w-full text-sm text-bad">{chosen?.name} cannot be assigned: {check.reasons.join(" ")}</p> : null}
        </div>
      ) : null}
    </li>
  );
}
