"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { Avatar } from "@/components/photos";
import { PageHeader, StatCard } from "@/components/ui";
import { useIbanga } from "@/lib/store";

export default function AdminProfilePage() {
  const { currentUser } = useIbanga();

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <PageHeader
          eyebrow="Account"
          title="Administrator profile"
          subtitle="Your identity and access details for marketplace operations."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Account role" value="Administrator" hint="Marketplace operations" />
          <StatCard label="Account status" value={currentUser?.active ? "Active" : "Inactive"} hint="Administrator account" accent="good" />
          <StatCard label="Workspace" value="iBanga" hint="Regional freight marketplace" accent="accent" />
        </div>
        <section className="mt-6 max-w-3xl rounded-2xl border border-line bg-white p-6 shadow-soft">
          <div className="flex items-center gap-4 border-b border-line pb-5">
            <Avatar src={currentUser?.photo} name={currentUser?.name ?? "Administrator"} size="lg" />
            <div>
              <h2 className="font-display text-xl text-navy">{currentUser?.name}</h2>
              <p className="text-sm text-muted">Administrator</p>
            </div>
          </div>
          <dl className="grid gap-x-8 gap-y-5 pt-5 sm:grid-cols-2">
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Email</dt><dd className="mt-1 text-sm font-medium text-navy">{currentUser?.email ?? "—"}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Phone</dt><dd className="mt-1 text-sm font-medium text-navy">{currentUser?.phone ?? "—"}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Location</dt><dd className="mt-1 text-sm font-medium text-navy">{currentUser?.location ?? "—"}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Organization</dt><dd className="mt-1 text-sm font-medium text-navy">{currentUser?.company ?? "—"}</dd></div>
          </dl>
        </section>
      </DashboardShell>
    </RequireAuth>
  );
}
