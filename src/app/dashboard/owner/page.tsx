"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { DashboardWelcomeCard, StatCard } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import { BookingManagementTable } from "@/components/booking-management-table";

export default function OwnerDashboard() {
  const { currentUser, trucks, bookings, users } = useIbanga();
  const mine = trucks;
  const firstName = (currentUser?.name ?? "").split(" ")[0] || "there";

  const myBookings = bookings.filter((b) =>
    mine.some((t) => t.id === b.truckId),
  );
  const requests = myBookings.filter((b) => b.status === "PENDING");
  const available = mine.filter((t) => t.status === "AVAILABLE");
  const active = myBookings.filter((b) =>
    ["ACCEPTED", "IN_PROGRESS", "DELIVERED"].includes(b.status),
  );

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        <DashboardWelcomeCard
          title={`Welcome back, ${firstName}.`}
          description={
            requests.length
              ? "You have requests to review — accepting keeps the truck locked for the trip."
              : available.length === mine.length && mine.length
                ? "All your trucks are available on the market. Find cargo to move."
                : "Keep your fleet honest: update trip status as you go."
          }
          actions={
            <>
              <Link
                href="/dashboard/owner/trucks/new"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
              >
                Add a truck
              </Link>
              <Link
                href="/dashboard/owner/requests"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                Review requests
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
          />
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl tracking-tight text-navy">All freight activity</h2>
              <p className="mt-1 text-sm text-muted">Search, filter, and export booking records for your fleet.</p>
            </div>
            <Link href="/dashboard/owner/trips" className="text-sm font-semibold text-brand hover:text-brand-dark">View trips</Link>
          </div>
          <BookingManagementTable bookings={myBookings} trucks={mine} users={users} counterparty="TRUCK_OWNER" detailPath={(booking) => `/dashboard/owner/trips/${booking.id}`} />
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}