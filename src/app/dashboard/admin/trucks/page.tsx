"use client";

import { Suspense } from "react";
import Link from "next/link";
import { LoadingBlock } from "@/components/common/async-state";
import { AdminPage } from "@/features/admin-platform/admin-page";
import { TruckBadge } from "@/components/status-badge";
import { useToast } from "@/components/toast";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmDialog, DataTable, PageHeader, StatCard, ViewLink } from "@/components/ui";
import { truckVerification } from "@/config/business-rules";
import { useOps } from "@/hooks/use-ops";
import { useIbanga } from "@/lib/store";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/types";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

function AdminTrucksContent() {
  const searchParams = useSearchParams();
  const { trucks, bookings, setAvailability, deleteTruck } = useIbanga();
  const toast = useToast();
  const { drivers, driverAssignments, documents } = useOps();
  const pendingByTruck = new Map<string, number>();
  for (const doc of documents) {
    if (doc.subjectKind === "TRUCK" && doc.status === "PENDING") {
      pendingByTruck.set(doc.subjectId, (pendingByTruck.get(doc.subjectId) ?? 0) + 1);
    }
  }
  const [busyTruckId, setBusyTruckId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<{ id: string; plateNumber: string } | null>(null);

  const available = trucks.filter((t) => t.status === "AVAILABLE").length;
  const heldTruckIds = new Set(
    bookings
      .filter((booking) => ACTIVE_BOOKING_STATUSES.includes(booking.status))
      .map((booking) => booking.truckId),
  );
  const truckIdsWithHistory = new Set(bookings.map((booking) => booking.truckId));

  async function toggleAvailability(id: string, status: "AVAILABLE" | "UNAVAILABLE") {
    setBusyTruckId(id);
    const error = await setAvailability(id, status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE");
    setBusyTruckId(null);
    if (error) toast(error, "bad");
    else toast(`Truck ${status === "AVAILABLE" ? "disabled" : "enabled"}.`, "good");
  }

  async function removeTruck(id: string, plateNumber: string) {
    setBusyTruckId(id);
    const error = await deleteTruck(id);
    setBusyTruckId(null);
    if (error) toast(error, "bad");
    else toast(`Truck ${plateNumber} was removed.`, "good");
  }

  return (
    <AdminPage permission="trucks">
      <>
        <PageHeader
          eyebrow="Marketplace"
          title="Trucks"
          subtitle={`${available} of ${trucks.length} trucks currently available to book.`}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
              <circle cx="7.5" cy="17.5" r="1.8" />
              <circle cx="17.5" cy="17.5" r="1.8" />
            </svg>
          }
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Fleet size" value={trucks.length} hint="Registered vehicles" href="/dashboard/admin/trucks" />
          <StatCard label="Available" value={available} hint="Ready for bookings" accent="good" href="/dashboard/admin/trucks?status=AVAILABLE" />
          <StatCard label="Owners" value={new Set(trucks.map((truck) => truck.ownerId)).size} hint="Active fleet partners" accent="accent" href="/dashboard/admin/trucks" />
          <StatCard label="Awaiting review" value={pendingByTruck.size} hint="Trucks with documents to check" accent="warn" href="/dashboard/admin/verifications" />
        </div>
        <div className="mt-5">
          <DataTable
            initialFilter={searchParams.get("status") ?? ""}
            columns={[{ label: "Vehicle" }, { label: "Associated driver" }, { label: "Owner" }, { label: "Capacity" }, { label: "Location" }, { label: "Route" }, { label: "Status" }, { label: "Verification" }, { label: "Actions", className: "text-right" }]}
            filterLabel="All availability"
            rows={trucks.map((truck) => {
              const assignment = driverAssignments.find((item) => item.truckId === truck.id && item.status === "ACTIVE") ?? driverAssignments.find((item) => item.truckId === truck.id && item.status === "UPCOMING");
              const driver = drivers.find((item) => item.id === assignment?.driverId) ?? drivers.find((item) => item.assignedTruckId === truck.id);
              return {
                id: truck.id,
                searchText: `${truck.plateNumber} ${truck.truckType} ${truck.owner?.name ?? ""} ${truck.currentLocation} ${truck.preferredRoute} ${driver?.name ?? ""}`,
                filterValue: truck.status,
                exportValues: [truck.plateNumber, driver?.name ?? "Unassigned", truck.owner?.name ?? "", `${truck.capacity} tons`, truck.currentLocation, truck.preferredRoute, truck.status, truckVerification(truck.id, documents), ""],
                cells: [
                  <span key={`${truck.id}-vehicle`}><strong className="block">{truck.plateNumber}</strong><span className="text-xs text-muted">{truck.truckType}</span></span>,
                  driver ? <Link key={`${truck.id}-driver`} href={`/dashboard/admin/drivers/${driver.id}`} className="font-semibold text-brand hover:text-brand-dark">{driver.name}</Link> : <span key={`${truck.id}-driver`} className="text-muted">Unassigned</span>,
                  truck.owner?.name ?? "—",
                  `${truck.capacity} tons`,
                  truck.currentLocation,
                  truck.preferredRoute,
                  <span key={`${truck.id}-status`}><TruckBadge status={truck.status} /></span>,
                  <span key={`${truck.id}-verification`} className="flex flex-col items-start gap-1">
                    <StatusBadge family="verification" status={truckVerification(truck.id, documents)} />
                    {pendingByTruck.get(truck.id) ? (
                      <Link href={`/dashboard/admin/trucks/${truck.id}`} className="text-xs font-semibold text-brand hover:text-brand-dark">
                        {pendingByTruck.get(truck.id)} to review
                      </Link>
                    ) : null}
                  </span>,
                  <div key={`${truck.id}-actions`} className="flex min-w-44 items-center justify-end gap-2">
                  <ViewLink href={`/dashboard/admin/trucks/${truck.id}`} label={`View truck ${truck.plateNumber}`} />
                  <button
                    type="button"
                    disabled={busyTruckId === truck.id || (truck.status === "UNAVAILABLE" && heldTruckIds.has(truck.id))}
                    onClick={() => void toggleAvailability(truck.id, truck.status)}
                    className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-navy hover:bg-background disabled:opacity-60"
                  >
                    {truck.status === "AVAILABLE" ? "Disable" : heldTruckIds.has(truck.id) ? "On booking" : "Enable"}
                  </button>
                  <button
                    type="button"
                    disabled={busyTruckId === truck.id || truckIdsWithHistory.has(truck.id)}
                    onClick={() => setRemoving({ id: truck.id, plateNumber: truck.plateNumber })}
                    className="rounded-lg border border-bad/20 px-2.5 py-1.5 text-xs font-semibold text-bad hover:bg-bad-soft disabled:opacity-60"
                  >
                    {truckIdsWithHistory.has(truck.id) ? "Has bookings" : "Remove"}
                  </button>
                  </div>,
                ],
              };
            })}
          />
        </div>

        {removing ? (
          <ConfirmDialog
            title="Remove truck"
            message={`Remove truck ${removing.plateNumber}? This cannot be undone.`}
            confirmLabel="Remove truck"
            tone="danger"
            busy={busyTruckId === removing.id}
            onConfirm={() => {
              const target = removing;
              void removeTruck(target.id, target.plateNumber).finally(() => setRemoving(null));
            }}
            onCancel={() => setRemoving(null)}
          />
        ) : null}
      </>
    </AdminPage>
  );
}

export default function AdminTrucksPage() {
  // useSearchParams needs a Suspense boundary so the page can be prerendered.
  return (
    <Suspense fallback={<LoadingBlock />}>
      <AdminTrucksContent />
    </Suspense>
  );
}
