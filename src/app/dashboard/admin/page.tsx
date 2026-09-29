"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { GhostButton, PageHeader, StatCard } from "@/components/ui";
import { api } from "@/lib/api";
import { useIbanga } from "@/lib/store";
import type { BookingStatus } from "@/lib/types";
import Link from "next/link";

const STATUS_FLOW: { status: BookingStatus; label: string; tone: string }[] = [
  { status: "PENDING", label: "Pending", tone: "bg-warn text-white" },
  { status: "ACCEPTED", label: "Accepted", tone: "bg-brand text-white" },
  { status: "IN_PROGRESS", label: "In progress", tone: "bg-accent text-white" },
  { status: "DELIVERED", label: "Delivered", tone: "bg-brand text-white" },
  { status: "COMPLETED", label: "Completed", tone: "bg-good text-white" },
  { status: "DISPUTED", label: "Disputed", tone: "bg-bad text-white" },
  { status: "REJECTED", label: "Rejected", tone: "bg-line text-muted" },
];

export default function AdminHome() {
  const { trucks, bookings, disputes, resetDemo } = useIbanga();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [commission, setCommission] = useState<{
    availableRwf: number;
    totalEarnedRwf: number;
  } | null>(null);
  const [userCountError, setUserCountError] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const openDisputes = disputes.filter((d) => d.status === "OPEN").length;

  useEffect(() => {
    let active = true;
    api<{ id: string }[]>("/users")
      .then((allUsers) => {
        if (active) setUserCount(allUsers.length);
      })
      .catch(() => {
        if (active) setUserCountError(true);
      });
    api<{ availableRwf: number; totalEarnedRwf: number }>("/wallet/admin/commission")
      .then((summary) => {
        if (active) setCommission(summary);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

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
        <PageHeader
          eyebrow="Marketplace overview"
          title="Admin dashboard"
          subtitle="Keep the marketplace fair — users, trucks, bookings and disputes, all in one place."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
              <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
              <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
              <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
            </svg>
          }
          actions={
            <>
              <Link
                href="/dashboard/admin/disputes"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-card"
              >
                Review disputes
                {openDisputes ? (
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand-dark">
                    {openDisputes}
                  </span>
                ) : null}
              </Link>
              <GhostButton
                type="button"
                disabled={resetting}
                onClick={() => void handleReset()}
              >
                {resetting ? "Resetting…" : "Reset demo data"}
              </GhostButton>
            </>
          }
        />
        {resetError ? (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-bad/20 bg-bad-soft px-3.5 py-2.5 text-sm text-bad">
            {resetError}
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Commission available"
            value={commission ? `RWF ${commission.availableRwf.toLocaleString("en-RW")}` : "—"}
            hint={commission ? `Earned RWF ${commission.totalEarnedRwf.toLocaleString("en-RW")}` : "Loading"}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2v20M17 5.5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
            accent="good"
          />
          <StatCard
            label="Users"
            value={userCount ?? "—"}
            hint={userCountError ? "Could not load" : userCount === null ? "Loading" : "All accounts"}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="8" r="3.5" />
                <path d="M3 20a6 6 0 0 1 12 0" />
                <path d="M16 5.2a3.5 3.5 0 0 1 0 5.6M17 14.5a6 6 0 0 1 4 5.5" />
              </svg>
            }
            accent="brand"
          />
          <StatCard
            label="Trucks"
            value={trucks.length}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
                <circle cx="7.5" cy="17.5" r="1.8" />
                <circle cx="17.5" cy="17.5" r="1.8" />
              </svg>
            }
            accent="accent"
          />
          <StatCard
            label="Bookings"
            value={bookings.length}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2.5" />
                <path d="M3 9.5h18M8 3v4m8-4v4" />
              </svg>
            }
            accent="good"
          />
          <StatCard
            label="Open disputes"
            value={openDisputes}
            hint="Needs review"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3 2.5 20h19L12 3Z" />
                <path d="M12 9.5V14" />
                <path d="M12 17.5h.01" />
              </svg>
            }
            accent="bad"
          />
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl tracking-tight text-navy">
            Bookings by status
          </h2>
          <p className="mt-1 text-sm text-muted">
            Where every freight request currently sits in its journey.
          </p>

          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-line">
            {STATUS_FLOW.map((step) => {
              const count = bookings.filter((b) => b.status === step.status).length;
              if (!count) return null;
              return (
                <div
                  key={step.status}
                  className={`${step.tone} transition-all`}
                  style={{ width: `${Math.round((count / (bookings.length || 1)) * 100)}%` }}
                  title={`${step.label}: ${count}`}
                />
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STATUS_FLOW.map((step) => {
              const count = bookings.filter((b) => b.status === step.status).length;
              return (
                <div
                  key={step.status}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3.5 shadow-soft"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-muted">
                    <span className={`h-2 w-2 rounded-full ${step.tone}`} />
                    {step.label}
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