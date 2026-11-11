"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { Hero, HeroLink, Icon, NumberTile } from "@/features/importer-dashboard/kit";
import { FleetCards } from "@/features/owner-dashboard/fleet";
import { TripPipeline } from "@/features/owner-dashboard/pipeline";
import { NewRequests } from "@/features/owner-dashboard/requests";
import { useOps } from "@/hooks/use-ops";
import { bookingStage } from "@/lib/booking-stage";
import { formatRwf } from "@/lib/payments";
import { useIbanga } from "@/lib/store";

export default function OwnerDashboard() {
  const { currentUser, trucks, bookings, users, walletBalance } = useIbanga();
  const { drivers } = useOps();
  const mine = trucks.filter((truck) => truck.ownerId === currentUser?.id);
  const myBookings = bookings.filter((booking) => mine.some((truck) => truck.id === booking.truckId));
  const myDrivers = drivers.filter((driver) => driver.ownerId === currentUser?.id);
  const firstName = (currentUser?.name ?? "").split(" ")[0] || "there";

  const requests = myBookings.filter((booking) => booking.status === "PENDING").length;
  const ready = myBookings.filter((booking) => bookingStage(booking) === "READY_TO_START").length;
  const onRoad = myBookings.filter((booking) => booking.status === "IN_PROGRESS").length;
  // The owner's share of money held by iBanga (deposits and balances not yet released).
  const held = myBookings.reduce(
    (sum, booking) => sum + (booking.payment && ["FUNDED", "HELD"].includes(booking.payment.status) ? booking.payment.ownerAmountRwf : 0),
    0,
  );
  const released = myBookings.reduce(
    (sum, booking) => sum + (booking.payment?.status === "RELEASED" ? booking.payment.ownerAmountRwf : 0),
    0,
  );

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        <div className="space-y-6">
          <Hero
            eyebrow="Truck owner workspace"
            title={`Welcome back, ${firstName}.`}
            subtitle={
              requests
                ? `${requests} request${requests === 1 ? " is" : "s are"} waiting for your answer. Once you accept, the importer pays 50% within the hour.`
                : ready
                  ? `${ready} trip${ready === 1 ? " is" : "s are"} paid and documented: ready to start.`
                  : "Your verified trucks are on the marketplace. Importers book the days they need; other days stay open."
            }
            actions={
              <>
                <HeroLink href="/dashboard/owner/bookings" primary>
                  <Icon name="inbox" className="h-4 w-4" /> Bookings
                  {requests ? <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">{requests}</span> : null}
                </HeroLink>
                <HeroLink href="/dashboard/owner/trucks/new">
                  <Icon name="truck" className="h-4 w-4" /> Add a truck
                </HeroLink>
              </>
            }
            aside={
              <div className="grid grid-cols-3 gap-3 sm:w-80">
                {[
                  { value: requests, label: "requests" },
                  { value: ready, label: "ready" },
                  { value: onRoad, label: "on the road" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl bg-white/10 p-3 text-center ring-1 ring-white/20 backdrop-blur">
                    <p className="text-2xl font-semibold tabular-nums">{item.value}</p>
                    <p className="text-xs text-white/75">{item.label}</p>
                  </div>
                ))}
              </div>
            }
          />

          <div className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <NumberTile label="Wallet" value={formatRwf(walletBalance)} hint="Available to withdraw" tone="good" icon={<Icon name="wallet" />} href="/dashboard/wallet" />
            <NumberTile label="Held for you" value={formatRwf(held)} hint="Released when the importer confirms receipt" icon={<Icon name="clock" />} href="/dashboard/owner/payments" />
            <NumberTile label="Earned" value={formatRwf(released)} hint="Released after commission" tone="accent" icon={<Icon name="card" />} href="/dashboard/owner/payments" />
            <NumberTile label="Fleet" value={`${mine.length} truck${mine.length === 1 ? "" : "s"}`} hint={`${myDrivers.length} driver${myDrivers.length === 1 ? "" : "s"}`} tone="warn" icon={<Icon name="truck" />} href="/dashboard/owner/trucks" />
          </div>

          <NewRequests bookings={myBookings} trucks={mine} users={users} />
          <TripPipeline bookings={myBookings} trucks={mine} />
          <FleetCards trucks={mine} />
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
