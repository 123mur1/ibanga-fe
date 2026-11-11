"use client";

import Link from "next/link";
import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { BookingWizard } from "@/features/booking-wizard/booking-wizard";

export default function NewBookingPage() {
  return (
    <RequireAuth role="IMPORTER">
      <DashboardShell role="IMPORTER">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5">
          <div>
            <p className="text-sm font-semibold text-brand">Booking request</p>
            <h1 className="text-2xl font-semibold text-navy sm:text-3xl">Request a freight booking</h1>
            <p className="mt-1 max-w-2xl text-base text-muted">
              Four short steps. Nothing is paid now: the owner accepts first, then you pay half, and the rest when your cargo arrives.
            </p>
          </div>
          <Link href="/" className="text-sm font-semibold text-brand">Cancel</Link>
        </div>
        <Suspense fallback={null}>
          <BookingWizard />
        </Suspense>
      </DashboardShell>
    </RequireAuth>
  );
}
