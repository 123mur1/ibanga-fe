"use client";

import { BookingManagementTable } from "@/components/booking-management-table";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/ui";
import { RequireAuth } from "@/components/require-auth";
import { useIbanga } from "@/lib/store";
import Link from "next/link";

export default function ImporterBookingsPage() {
  const { currentUser, bookings, trucks, users } = useIbanga();
  const mine = bookings.filter((b) => b.importerId === currentUser?.id);

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

        <BookingManagementTable bookings={mine} trucks={trucks} users={users} counterparty="IMPORTER" detailPath={(booking) => `/dashboard/importer/bookings/${booking.id}`} />
      </DashboardShell>
    </RequireAuth>
  );
}