"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { ActionCenter, importerActions } from "@/features/importer-dashboard/action-center";
import { Hero, HeroLink, Icon, NumberTile } from "@/features/importer-dashboard/kit";
import { ActiveTrips, RecentBookings } from "@/features/importer-dashboard/trip-lists";
import { formatRwf } from "@/lib/payments";
import { useIbanga } from "@/lib/store";

export default function ImporterHome() {
  const { currentUser, bookings, trucks, walletBalance } = useIbanga();
  const mine = bookings.filter((booking) => booking.importerId === currentUser?.id);
  const firstName = (currentUser?.name ?? "").split(" ")[0] || "there";
  const active = mine.filter((booking) => ["ACCEPTED", "IN_PROGRESS", "DELIVERED"].includes(booking.status)).length;
  const requested = mine.filter((booking) => booking.status === "PENDING").length;
  const completed = mine.filter((booking) => booking.status === "COMPLETED").length;
  // Money that actually left the importer: what is held or was released (refunds excluded).
  const spent = mine.reduce(
    (sum, booking) => sum + (booking.payment && ["FUNDED", "HELD", "RELEASED"].includes(booking.payment.status) ? booking.payment.amountRwf : 0),
    0,
  );
  const todo = importerActions(mine).length;

  return (
    <RequireAuth role="IMPORTER">
      <DashboardShell role="IMPORTER">
        <div className="space-y-6">
          <Hero
            eyebrow="Importer workspace"
            title={`Hello, ${firstName}.`}
            subtitle={
              todo
                ? `You have ${todo} thing${todo === 1 ? "" : "s"} to do below. Deposits are due within an hour of the owner accepting.`
                : "Find a verified truck, send a request and pay half once the owner accepts. The rest is paid when your cargo arrives."
            }
            actions={
              <>
                <HeroLink href="/trucks" primary>
                  <Icon name="search" className="h-4 w-4" /> Find a truck
                </HeroLink>
                <HeroLink href="/dashboard/importer/bookings">
                  <Icon name="calendar" className="h-4 w-4" /> My bookings
                  {requested ? <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand-dark">{requested}</span> : null}
                </HeroLink>
              </>
            }
            aside={
              <div className="grid grid-cols-2 gap-3 sm:w-72">
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur">
                  <p className="text-3xl font-semibold tabular-nums">{active}</p>
                  <p className="text-xs text-white/75">trips in motion</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur">
                  <p className="text-3xl font-semibold tabular-nums">{todo}</p>
                  <p className="text-xs text-white/75">to do</p>
                </div>
              </div>
            }
          />

          <div className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <NumberTile label="Active trips" value={active} hint={requested ? `${requested} waiting for owners` : "Accepted to delivered"} icon={<Icon name="route" />} href="/dashboard/tracking" />
            <NumberTile label="Completed" value={completed} hint="Delivered and paid" tone="good" icon={<Icon name="check" />} href="/dashboard/importer/bookings?status=COMPLETED" />
            <NumberTile label="Total paid" value={formatRwf(spent)} hint="Deposits and balances" tone="accent" icon={<Icon name="card" />} href="/dashboard/importer/payments" />
            <NumberTile label="Wallet" value={formatRwf(walletBalance)} hint="Refunds land here" tone="warn" icon={<Icon name="wallet" />} href="/dashboard/wallet" />
          </div>

          <ActionCenter bookings={mine} />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <ActiveTrips bookings={mine} trucks={trucks} />
            <RecentBookings bookings={mine} />
          </div>
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
