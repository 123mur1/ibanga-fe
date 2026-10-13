"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { StatusBars } from "@/components/charts";
import { DashboardWelcomeCard, StatCard } from "@/components/ui";
import { formatRwf } from "@/lib/payments";
import { useIbanga } from "@/lib/store";
import Link from "next/link";
import { BookingManagementTable } from "@/components/booking-management-table";

export default function ImporterHome() {
  const { currentUser, bookings, trucks, users } = useIbanga();
  const mine = bookings.filter((b) => b.importerId === currentUser?.id);
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
                : "Find a truck, send a request, and pay from your wallet after the owner confirms."
          }
          actions={
            <>
              <Link
                href="/trucks"
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
              <h2 className="text-lg font-semibold text-navy">Live cargo</h2>
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

        <div className="mt-8 flex items-center justify-between">
          <h2 className="font-display text-xl tracking-tight text-navy">Booking activity</h2>
          <Link href="/dashboard/importer/bookings" className="text-sm font-semibold text-brand hover:text-brand-dark">View all</Link>
        </div>
        <BookingManagementTable bookings={mine} trucks={trucks} users={users} counterparty="IMPORTER" detailPath={(booking) => `/dashboard/importer/bookings/${booking.id}`} />
      </DashboardShell>
    </RequireAuth>
  );
}