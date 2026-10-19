"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { BarChartCard, DonutCard, LineChartCard, StatusBars, bucketByMonth } from "@/components/charts";
import { DashboardWelcomeCard, StatCard } from "@/components/ui";
import { formatRwf } from "@/lib/payments";
import { OwnerKpis } from "@/features/owner-fleet/owner-kpis";
import { useIbanga } from "@/lib/store";
import type { BookingStatus } from "@/lib/types";

const STATUS_SLICES: { status: BookingStatus; label: string; color: string }[] = [
  { status: "PENDING", label: "Pending", color: "#cfe6ef" },
  { status: "ACCEPTED", label: "Accepted", color: "#a3cfe0" },
  { status: "IN_PROGRESS", label: "In progress", color: "#5aa3c0" },
  { status: "DELIVERED", label: "Delivered", color: "#00628b" },
  { status: "COMPLETED", label: "Completed", color: "#0a3d50" },
  { status: "DISPUTED", label: "Disputed", color: "#122832" },
  { status: "REJECTED", label: "Rejected", color: "#d5e0e7" },
];

export default function OwnerDashboard() {
  const { currentUser, trucks, bookings } = useIbanga();
  const mine = trucks.filter((truck) => truck.ownerId === currentUser?.id);
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
  const earning = myBookings.filter((booking) => booking.payment && booking.payment.status !== "REFUNDED");
  const totalEarned = earning.reduce((sum, booking) => sum + (booking.payment?.ownerAmountRwf ?? 0), 0);

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

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <StatusBars
            title="Fleet workload"
            caption="Requests, trips on the road, and payments still held."
            items={[
              { label: "Requests to confirm", value: requests.length, tone: "warn" },
              { label: "Trips to track", value: active.length, tone: "accent" },
              { label: "Payments held", value: heldForMe.length, tone: "brand" },
              { label: "Trucks available", value: available.length, tone: "good" },
            ]}
          />
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

        <OwnerKpis />

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl tracking-tight text-navy">Your fleet analytics</h2>
              <p className="mt-1 text-sm text-muted">Bookings, earnings and how your trucks are being used.</p>
            </div>
            <Link href="/dashboard/owner/bookings" className="text-sm font-semibold text-brand hover:text-brand-dark">View all bookings</Link>
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <LineChartCard
              title="Booking activity"
              caption="New bookings on your trucks each month"
              badge="Last 6 months"
              points={bucketByMonth(myBookings, (booking) => booking.createdAt)}
              unit="bookings"
            />
            <BarChartCard
              title="Earnings"
              caption="Your share of payments by month, after commission"
              badge={`Total ${formatRwf(totalEarned)}`}
              points={bucketByMonth(earning, (booking) => booking.payment?.paidAt, (booking) => booking.payment?.ownerAmountRwf ?? 0)}
              format={formatRwf}
              empty="No earnings in the last six months."
            />
            <DonutCard
              title="Bookings by status"
              caption="Where every booking on your fleet sits today"
              centerLabel="bookings"
              slices={STATUS_SLICES.map((slice) => ({
                label: slice.label,
                color: slice.color,
                count: myBookings.filter((booking) => booking.status === slice.status).length,
              }))}
              empty="No bookings on your trucks yet."
            />
            <DonutCard
              title="Fleet availability"
              caption="Current status of your trucks"
              centerLabel="trucks"
              slices={[
                { label: "Available", color: "#00628b", count: available.length },
                { label: "Unavailable", color: "#d5e0e7", count: mine.length - available.length },
              ]}
              empty="You have not added any trucks yet."
            />
          </div>
        </section>
      </DashboardShell>
    </RequireAuth>
  );
}
