"use client";

import { RoleShell } from "@/components/common/role-shell";
import { TruckThumb } from "@/components/photos";
import { DriverVerification } from "@/features/documents/driver-verification";
import { CurrentTrip } from "@/features/driver/current-trip";
import { TripHistory, UpcomingTrips } from "@/features/driver/trip-lists";
import { EmptyNote, Hero, Icon, NumberTile } from "@/features/importer-dashboard/kit";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useIbanga } from "@/lib/store";
import type { Booking } from "@/lib/types";

const byPickup = (a: Booking, b: Booking) => a.pickupDate.localeCompare(b.pickupDate);

export default function DriverDashboardPage() {
  const actor = useActor();
  const { trucks, users, bookings } = useIbanga();
  const ops = useOps();
  const driver = ops.drivers.find((item) => item.userId === actor?.id);
  const truck = trucks.find((item) => item.id === driver?.assignedTruckId);
  const owner = users.find((item) => item.id === (truck?.ownerId ?? driver?.ownerId));
  // The API only returns the trips of the truck this driver drives.
  const trips = truck ? bookings.filter((booking) => booking.truckId === truck.id) : bookings;

  const onRoad = trips.filter((booking) => booking.status === "IN_PROGRESS").sort(byPickup);
  const confirmed = trips.filter((booking) => booking.status === "ACCEPTED").sort(byPickup);
  const delivered = trips.filter((booking) => booking.status === "DELIVERED").sort(byPickup);
  const current = onRoad[0] ?? confirmed[0] ?? delivered[0];
  const upcoming = trips
    .filter((booking) => (booking.status === "ACCEPTED" || booking.status === "PENDING") && booking.id !== current?.id)
    .sort(byPickup);
  const history = trips
    .filter((booking) => ["COMPLETED", "CANCELLED", "REJECTED", "DISPUTED"].includes(booking.status) || (booking.status === "DELIVERED" && booking.id !== current?.id))
    .sort((a, b) => b.pickupDate.localeCompare(a.pickupDate));
  const completed = trips.filter((booking) => booking.status === "COMPLETED").length;
  const importer = current ? users.find((user) => user.id === current.importerId) : undefined;
  const firstName = (actor?.name ?? "").split(" ")[0] || "driver";

  return (
    <RoleShell role="DRIVER">
      <div className="space-y-6">
        <Hero
          eyebrow="Driver workspace"
          title={`Hello, ${firstName}.`}
          subtitle={
            onRoad.length
              ? "You are on the road. Share your location and send an update if anything changes."
              : current
                ? "Your next trip is below. Start it once the deposit and documents are in."
                : "No trip right now. Your truck owner's accepted bookings will appear here."
          }
          aside={
            truck ? (
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur sm:w-80">
                <TruckThumb photos={truck.photos} alt={truck.plateNumber} className="h-14 w-14 rounded-xl object-cover" />
                <div className="min-w-0">
                  <p className="font-semibold">{truck.plateNumber}</p>
                  <p className="truncate text-xs text-white/75">{truck.truckType} · {truck.capacity} t · {truck.currentLocation}</p>
                  {owner ? <p className="truncate text-xs text-white/75">Owner: {owner.company || owner.name}{owner.phone ? ` · ${owner.phone}` : ""}</p> : null}
                </div>
              </div>
            ) : undefined
          }
        />

        <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
          <NumberTile label="On the road" value={onRoad.length} icon={<Icon name="steering" />} />
          <NumberTile label="Coming up" value={upcoming.length + (current && current.status === "ACCEPTED" ? 1 : 0)} tone="accent" icon={<Icon name="calendar" />} />
          <NumberTile label="Awaiting receipt" value={delivered.length} tone="warn" icon={<Icon name="clock" />} />
          <NumberTile label="Completed" value={completed} tone="good" icon={<Icon name="check" />} />
        </div>

        {!driver ? (
          <EmptyNote title="Your driver profile is not linked yet" text="Ask your truck owner to add you as a driver and assign you a truck. Your trips will then appear here." />
        ) : current ? (
          <CurrentTrip booking={current} importerName={importer?.company || importer?.name} />
        ) : (
          <EmptyNote title="No current trip" text="When your truck owner accepts a booking for your truck, it appears here with everything you need on the road." />
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingTrips bookings={upcoming} />
          <TripHistory bookings={history} />
        </div>

        <DriverVerification />
      </div>
    </RoleShell>
  );
}
