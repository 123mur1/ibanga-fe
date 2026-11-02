"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { DashboardWelcomeCard, StatCard } from "@/components/ui";
import { formatRwf } from "@/lib/payments";
import { useOps } from "@/hooks/use-ops";
import { useIbanga } from "@/lib/store";

export default function OwnerDashboard() {
  const { currentUser, trucks, bookings } = useIbanga();
  const { drivers } = useOps();
  const mine = trucks.filter((truck) => truck.ownerId === currentUser?.id);
  const myDrivers = drivers.filter((driver) => driver.ownerId === currentUser?.id);
  const firstName = (currentUser?.name ?? "").split(" ")[0] || "there";

  const myBookings = bookings.filter((b) =>
    mine.some((t) => t.id === b.truckId),
  );
  const requests = myBookings.filter((b) => b.status === "PENDING");
  const available = mine.filter((t) => t.status === "AVAILABLE");
  const active = myBookings.filter((b) =>
    ["ACCEPTED", "IN_PROGRESS", "DELIVERED"].includes(b.status),
  );
  const heldForMe = myBookings.filter((booking) => booking.payment?.status === "HELD");

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        <DashboardWelcomeCard
          title={`Welcome back, ${firstName}.`}
          description={
            requests.length
              ? "Requests are waiting for your confirmation. The importer pays after you confirm the truck is available."
              : available.length === mine.length && mine.length
                ? "All your trucks are available on the market. Find cargo to move."
                : "Keep your fleet honest: update trip status as you go."
          }
          actions={
            <>
              <Link
                href="/dashboard/owner/trucks/new"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-soft transition hover:bg-brand-soft"
              >
                Add a truck
              </Link>
              <Link
                href="/dashboard/owner/bookings"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/15"
              >
                View bookings
                {requests.length ? <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand-dark">{requests.length}</span> : null}
              </Link>
            </>
          }
          metric={`${available.length}/${mine.length}`}
          metricLabel="trucks available"
          metricIcon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
              <circle cx="7.5" cy="17.5" r="1.8" />
              <circle cx="17.5" cy="17.5" r="1.8" />
            </svg>
          }
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <StatCard
            label="My trucks"
            value={mine.length}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
                <circle cx="7.5" cy="17.5" r="1.8" />
                <circle cx="17.5" cy="17.5" r="1.8" />
              </svg>
            }
            accent="brand"
            href="/dashboard/owner/trucks"
          />
          <StatCard
            label="Available now"
            value={available.length}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            }
            accent="good"
            href="/dashboard/owner/trucks?status=AVAILABLE"
          />
          <StatCard
            label="Pending requests"
            value={requests.length}
            hint="Review now"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 13h5l1.5 2.5h5L16 13h5" />
                <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
              </svg>
            }
            accent="warn"
            href="/dashboard/owner/bookings?status=PENDING"
          />
          <StatCard
            label="Active trips"
            value={active.length}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="6" cy="19" r="2.5" />
                <circle cx="18" cy="5" r="2.5" />
                <path d="M8.5 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
              </svg>
            }
            accent="accent"
            href="/dashboard/tracking"
          />
          <StatCard
            label="Drivers"
            value={myDrivers.length}
            hint="Registered with you"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 21a7 7 0 0 1 14 0M19 8a3 3 0 0 1 0 6" />
              </svg>
            }
            accent="brand"
            href="/dashboard/owner/drivers"
          />
        </div>

        <div className="mt-6">
          <section className="rounded-2xl border border-line bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-navy">Held until both sides confirm</h2>
              <Link href="/dashboard/tracking" className="text-sm font-semibold text-brand">Live trips</Link>
            </div>
            <p className="mt-2 text-2xl font-semibold text-navy">{formatRwf(heldForMe.reduce((sum, booking) => sum + (booking.payment?.ownerAmountRwf ?? 0), 0))}</p>
            <p className="mt-1 text-sm text-muted">Your share, released after you confirm delivery and the importer confirms receipt.</p>
            <ul className="mt-4 space-y-2">
              {active.slice(0, 3).map((booking) => (
                <li key={booking.id}>
                  <Link href={`/dashboard/owner/bookings/${booking.id}`} className="font-semibold text-navy hover:text-brand">{booking.pickupLocation} to {booking.destination}</Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
