"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { BarChartCard, DonutCard, LineChartCard, StatusBars, bucketByMonth } from "@/components/charts";
import { DashboardWelcomeCard, StatCard } from "@/components/ui";
import { formatRwf } from "@/lib/payments";
import { useIbanga } from "@/lib/store";
import type { BookingStatus, PaymentStatus } from "@/lib/types";
import Link from "next/link";

const STATUS_SLICES: { status: BookingStatus; label: string; color: string }[] = [
  { status: "PENDING", label: "Pending", color: "#cfe6ef" },
  { status: "ACCEPTED", label: "Accepted", color: "#a3cfe0" },
  { status: "IN_PROGRESS", label: "In progress", color: "#5aa3c0" },
  { status: "DELIVERED", label: "Delivered", color: "#00628b" },
  { status: "COMPLETED", label: "Completed", color: "#0a3d50" },
  { status: "DISPUTED", label: "Disputed", color: "#122832" },
  { status: "REJECTED", label: "Rejected", color: "#d5e0e7" },
];

const PAYMENT_SLICES: { label: string; color: string; statuses: PaymentStatus[] }[] = [
  { label: "Held in escrow", color: "#00628b", statuses: ["HELD", "FUNDED", "AUTHORIZED"] },
  { label: "Released", color: "#0a3d50", statuses: ["RELEASED"] },
  { label: "Pending", color: "#a3cfe0", statuses: ["PENDING"] },
  { label: "Refunded", color: "#d5e0e7", statuses: ["REFUNDED"] },
];

export default function ImporterHome() {
  const { currentUser, bookings } = useIbanga();
  const mine = bookings.filter((b) => b.importerId === currentUser?.id);
  const paid = mine.filter((booking) => booking.payment);
  const totalPaid = paid.reduce((sum, booking) => sum + (booking.payment?.amountRwf ?? 0), 0);
  const pending = mine.filter((b) => b.status === "PENDING").length;
  const active = mine.filter((b) =>
    ["ACCEPTED", "IN_PROGRESS", "DELIVERED"].includes(b.status),
  ).length;
  const toConfirm = mine.filter((b) => b.status === "DELIVERED");
  const held = mine.filter((booking) => booking.payment?.status === "HELD");
  const live = mine.filter((booking) => ["ACCEPTED", "IN_PROGRESS", "DELIVERED"].includes(booking.status));
  const firstName = (currentUser?.name ?? "").split(" ")[0] || "there";

  return (
    <RequireAuth role="IMPORTER">
      <DashboardShell role="IMPORTER">
        <DashboardWelcomeCard
          title={`Hello, ${firstName}.`}
          description={
            toConfirm.length
              ? "Some deliveries are waiting on your confirmation — let the trucks back to work."
              : pending
                ? "You have pending requests. Track them here while owners decide."
                : "Find a truck, send a request, and pay after the owner confirms."
          }
          actions={
            <>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft"
              >
                Find a truck
              </Link>
              <Link
                href="/dashboard/importer/bookings"
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/15"
              >
                My bookings
                {pending ? <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand-dark">{pending}</span> : null}
              </Link>
            </>
          }
          metric={active || pending ? String(active + pending) : undefined}
          metricLabel="trips in motion"
          metricIcon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="6" cy="19" r="2.5" />
              <circle cx="18" cy="5" r="2.5" />
              <path d="M8.5 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
            </svg>
          }
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Open requests"
            value={pending}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 13h5l1.5 2.5h5L16 13h5" />
                <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
              </svg>
            }
            accent="warn"
          />
          <StatCard
            label="Active trips"
            value={active}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="6" cy="19" r="2.5" />
                <circle cx="18" cy="5" r="2.5" />
                <path d="M8.5 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
              </svg>
            }
            accent="brand"
          />
          <StatCard
            label="Held for you"
            value={formatRwf(held.reduce((sum, booking) => sum + (booking.payment?.amountRwf ?? 0), 0))}
            hint="In the iBanga account"
            accent="brand"
          />
          <StatCard
            label="Waiting for you"
            value={toConfirm.length}
            hint="Confirm receipt"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            }
            accent="good"
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <StatusBars
            title="Your bookings"
            caption="Where your freight sits right now."
            items={[
              { label: "Waiting on the owner", value: pending, tone: "warn" },
              { label: "On the road", value: live.length, tone: "accent" },
              { label: "Need your receipt", value: toConfirm.length, tone: "good" },
              { label: "Disputed", value: mine.filter((booking) => booking.status === "DISPUTED").length, tone: "bad" },
            ]}
          />
          <section className="rounded-2xl border border-line bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-navy">Live trips</h2>
              <Link href="/dashboard/tracking" className="text-sm font-semibold text-brand">Open map</Link>
            </div>
            <ul className="mt-4 space-y-3">
              {live.length === 0 ? <li className="text-sm text-muted">No cargo is moving yet.</li> : live.slice(0, 4).map((booking) => (
                <li key={booking.id}>
                  <Link href={`/dashboard/tracking/${booking.id}`} className="font-semibold text-navy hover:text-brand">{booking.pickupLocation} to {booking.destination}</Link>
                  <p className="text-sm text-muted">{booking.payment?.status === "HELD" ? "Payment held" : "Payment recorded"} · {booking.cargoType}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl tracking-tight text-navy">Your freight analytics</h2>
              <p className="mt-1 text-sm text-muted">Booking trends, spending and where every request stands.</p>
            </div>
            <Link href="/dashboard/importer/bookings" className="text-sm font-semibold text-brand hover:text-brand-dark">View all bookings</Link>
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <LineChartCard
              title="Booking activity"
              caption="New bookings you created each month"
              badge="Last 6 months"
              points={bucketByMonth(mine, (booking) => booking.createdAt)}
              unit="bookings"
            />
            <BarChartCard
              title="Spending"
              caption="Amount paid for bookings by month"
              badge={`Total ${formatRwf(totalPaid)}`}
              points={bucketByMonth(paid, (booking) => booking.payment?.paidAt, (booking) => booking.payment?.amountRwf ?? 0)}
              format={formatRwf}
              empty="No payments in the last six months."
            />
            <DonutCard
              title="Bookings by status"
              caption="Where every freight request sits today"
              centerLabel="bookings"
              slices={STATUS_SLICES.map((slice) => ({
                label: slice.label,
                color: slice.color,
                count: mine.filter((booking) => booking.status === slice.status).length,
              }))}
              empty="You have not made any bookings yet."
            />
            <DonutCard
              title="Payments by status"
              caption="Escrow state of the money you have paid"
              centerLabel="payments"
              slices={PAYMENT_SLICES.map((slice) => ({
                label: slice.label,
                color: slice.color,
                count: paid.filter((booking) => slice.statuses.includes(booking.payment!.status)).length,
              }))}
              empty="No payments have been made yet."
            />
          </div>
        </section>
      </DashboardShell>
    </RequireAuth>
  );
}