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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight text-navy">
              Admin dashboard
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              Keep the marketplace fair: users, trucks, bookings and disputes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/admin/disputes"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-card"
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
          </div>
        </div>
        {resetError ? (
          <p className="mt-4 w-full text-sm text-bad">{resetError}</p>
        ) : null}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Users" value={users.length} />
          <StatCard label="Trucks" value={trucks.length} />
          <StatCard label="Bookings" value={bookings.length} />
          <StatCard
            label="Open disputes"
            value={openDisputes}
            hint="Needs review"
          />
        </div>
        <div className="mt-10">
          <h2 className="font-display text-xl tracking-tight text-navy">
            Bookings by status
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[
              "PENDING",
              "ACCEPTED",
              "IN_PROGRESS",
              "DELIVERED",
              "COMPLETED",
              "DISPUTED",
              "REJECTED",
            ].map((status) => {
              const count = bookings.filter((b) => b.status === status).length;
              return (
                <div
                  key={status}
                  className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3.5 shadow-soft"
                >
                  <span className="text-sm font-medium text-muted">
                    {status.replace("_", " ")}
                  </span>
                  <span
                    className={`inline-flex min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-sm font-semibold ${
                      count === 0 ? "bg-line text-muted" : "bg-brand-soft text-brand-dark"
                    }`}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
