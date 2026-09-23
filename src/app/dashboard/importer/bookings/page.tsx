"use client";

import { BookingRow } from "@/components/booking-row";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState, PageHeader } from "@/components/ui";
import { RequireAuth } from "@/components/require-auth";
import { useIbanga } from "@/lib/store";
import Link from "next/link";

export default function ImporterBookingsPage() {
  const { currentUser, bookings, trucks } = useIbanga();
  const mine = bookings.filter((b) => b.importerId === currentUser?.id);
  const active = mine.filter((b) => ["PENDING", "ACCEPTED", "IN_PROGRESS", "DELIVERED", "DISPUTED"].includes(b.status));
  const done = mine.filter((b) => ["COMPLETED", "REJECTED"].includes(b.status));

  return (
    <RequireAuth role="IMPORTER">
      <DashboardShell role="IMPORTER">
        <PageHeader
          eyebrow="Cargo tracking"
          title="My bookings"
          subtitle="Follow each freight request from pending to completed or disputed."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2.5" />
              <path d="M3 9.5h18M8 3v4m8-4v4" />
            </svg>
          }
          actions={
            <Link
              href="/trucks"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-card"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m20 20-3.8-3.8" />
              </svg>
              Find a truck
            </Link>
          }
        />

        <div className="mt-6 space-y-3">
          {mine.length ? (
            <>
              <div className="flex items-center gap-2 pt-2">
                <h2 className="font-display text-lg tracking-tight text-navy">In motion</h2>
                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-dark">
                  {active.length}
                </span>
              </div>
              {active.length ? (
                <div className="space-y-3">
                  {active.map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      truck={trucks.find((t) => t.id === booking.truckId)}
                      href={`/dashboard/importer/bookings/${booking.id}`}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-line bg-card px-5 py-6 text-sm text-muted">
                  No active bookings right now.
                </p>
              )}

              <div className="flex items-center gap-2 pt-6">
                <h2 className="font-display text-lg tracking-tight text-navy">Past</h2>
                <span className="rounded-full bg-line px-2.5 py-0.5 text-xs font-semibold text-muted">
                  {done.length}
                </span>
              </div>
              {done.length ? (
                <div className="space-y-3">
                  {done.map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      truck={trucks.find((t) => t.id === booking.truckId)}
                      href={`/dashboard/importer/bookings/${booking.id}`}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              title="No bookings yet"
              text="Find an available truck, call the owner, then submit a request — the truck locks for you immediately."
              action={
                <Link
                  href="/trucks"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-card"
                >
                  Browse trucks
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              }
            />
          )}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}