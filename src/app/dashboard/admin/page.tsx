"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { StatCard, GhostButton } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import Link from "next/link";

export default function AdminHome() {
  const { users, trucks, bookings, disputes, resetDemo } = useIbanga();
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const openDisputes = disputes.filter((d) => d.status === "OPEN").length;

  async function handleReset() {
    setResetting(true);
    setResetError(null);
    const error = await resetDemo();
    if (error) setResetError(error);
    setResetting(false);
  }

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <h1 className="font-display text-3xl text-navy">Admin dashboard</h1>
        <p className="mt-1 text-muted">
          Keep the marketplace fair: users, trucks, bookings and disputes.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <StatCard label="Users" value={users.length} />
          <StatCard label="Trucks" value={trucks.length} />
          <StatCard label="Bookings" value={bookings.length} />
          <StatCard
            label="Open disputes"
            value={openDisputes}
            hint="Needs review"
          />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard/admin/disputes"
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
          >
            Review disputes
          </Link>
          <GhostButton
            type="button"
            disabled={resetting}
            onClick={() => void handleReset()}
          >
            {resetting ? "Resetting…" : "Reset demo data"}
          </GhostButton>
          {resetError ? (
            <p className="w-full text-sm text-bad">{resetError}</p>
          ) : null}
        </div>
        <h2 className="mt-10 font-display text-xl text-navy">By status</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            "PENDING",
            "ACCEPTED",
            "IN_PROGRESS",
            "DELIVERED",
            "COMPLETED",
            "DISPUTED",
            "REJECTED",
          ].map((status) => (
            <li
              key={status}
              className="flex justify-between rounded-xl border border-line bg-card px-4 py-3 text-sm"
            >
              <span>{status.replace("_", " ")}</span>
              <span className="font-semibold">
                {bookings.filter((b) => b.status === status).length}
              </span>
            </li>
          ))}
        </ul>
      </DashboardShell>
    </RequireAuth>
  );
}
