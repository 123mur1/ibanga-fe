"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/toast";
import { GhostButton, PrimaryButton } from "@/components/ui";
import { TripUpdateDialog } from "@/features/driver/trip-update-dialog";
import { useOps } from "@/hooks/use-ops";
import { REQUIRED_DOCUMENTS } from "@/lib/booking-stage";
import { useIbanga } from "@/lib/store";
import type { Booking, BookingStatus } from "@/lib/types";

export function TripActions({ booking }: { booking: Booking }) {
  const { setBookingStatus } = useIbanga();
  const { drivers } = useOps();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [composing, setComposing] = useState(false);
  const truckDrivers = drivers.filter((driver) => driver.assignedTruckId === booking.truckId);
  const driverLink = `/dashboard/owner/drivers/new?truckId=${encodeURIComponent(booking.truckId)}`;
  const documentsReady = REQUIRED_DOCUMENTS.every((required) =>
    (booking.documents ?? []).some((document) => document.kind === required.kind),
  );

  async function move(status: BookingStatus, success: string) {
    if (busy) return;
    setBusy(true);
    try {
      const error = await setBookingStatus(booking.id, status);
      toast(error ?? success, error ? "bad" : "good");
    } finally {
      setBusy(false);
    }
  }

  if (booking.status === "PENDING") {
    return (
      <div className="flex flex-wrap gap-3 rounded-xl border border-line bg-card p-4">
        <PrimaryButton type="button" disabled={busy} onClick={() => void move("ACCEPTED", "Truck confirmed.")}>
          {busy ? "Confirming…" : "Confirm truck is available"}
        </PrimaryButton>
        <GhostButton type="button" disabled={busy} className="hover:border-bad/30 hover:text-bad" onClick={() => void move("REJECTED", "Request declined.")}>
          {busy ? "Please wait…" : "Decline request"}
        </GhostButton>
      </div>
    );
  }

  if (booking.status === "ACCEPTED" && booking.payment?.status === "FUNDED") {
    return (
      <>
        <div className="rounded-xl border border-line bg-card p-4">
          <p className="text-sm text-muted">Payment is in. The cargo and tax documents must also be uploaded before the trip can start.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryButton type="button" disabled={busy || !documentsReady} onClick={() => void move("IN_PROGRESS", "Trip started.")}>
              {busy ? "Starting…" : "Start trip"}
            </PrimaryButton>
            <GhostButton type="button" onClick={() => setComposing(true)}>Send trip update</GhostButton>
          </div>
          {!documentsReady ? <p className="mt-2 text-xs text-warn">Upload both required booking documents before starting the trip.</p> : null}
          <DriverAssignmentLinks drivers={truckDrivers} href={driverLink} />
        </div>
        {composing ? <TripUpdateDialog booking={booking} onClose={() => setComposing(false)} /> : null}
      </>
    );
  }

  if (booking.status === "ACCEPTED") {
    return (
      <div className="space-y-3 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
        <p>Waiting for the importer to pay before this trip can start. You can prepare the driver assignment now.</p>
        <DriverAssignmentLinks drivers={truckDrivers} href={driverLink} />
      </div>
    );
  }

  if (booking.status === "IN_PROGRESS") {
    return (
      <>
        <div className="rounded-xl border border-line bg-card p-4">
          <p className="text-sm text-muted">Send live progress or vehicle-condition updates to the importer, then mark the cargo delivered when it reaches the destination.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <GhostButton type="button" onClick={() => setComposing(true)}>Send trip update</GhostButton>
            <PrimaryButton type="button" disabled={busy} onClick={() => void move("DELIVERED", "Delivery recorded.")}>
              {busy ? "Updating…" : "Confirm cargo delivered"}
            </PrimaryButton>
          </div>
        </div>
        {composing ? <TripUpdateDialog booking={booking} onClose={() => setComposing(false)} /> : null}
      </>
    );
  }

  return null;
}

function DriverAssignmentLinks({
  drivers,
  href,
}: {
  drivers: ReturnType<typeof useOps>["drivers"];
  href: string;
}) {
  return (
    <div className="mt-3 border-t border-line/70 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Driver for this truck</p>
      {drivers.length ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {drivers.map((driver) => (
            <li key={driver.id}>
              <Link href={`/dashboard/owner/drivers/${driver.id}`} className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:border-brand hover:text-brand">
                {driver.name} · {driver.status.replaceAll("_", " ").toLowerCase()}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-muted">No driver is linked to this truck yet.</p>
      )}
      <Link href={href} className="mt-2 inline-flex text-sm font-semibold text-brand hover:text-brand-dark">
        Add a driver to this truck
      </Link>
    </div>
  );
}
