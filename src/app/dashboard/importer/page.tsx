"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { DashboardWelcomeCard, StatCard } from "@/components/ui";
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
                : "Find a priced truck, book it, and pay from your wallet after the owner accepts."
          }
          actions={
            <>
              <Link
                href="/trucks"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
              >
                Find a truck
              </Link>
              <Link
                href="/dashboard/importer/bookings"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:-translate-y-0.5 hover:bg-white/15"
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

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
            label="Waiting for you"
            value={toConfirm.length}
            hint="Confirm delivery"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            }
            accent="good"
          />
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