"use client";

import { WorkspaceLoading } from "@/components/loading";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { DataTable, PageHeader, StatCard } from "@/components/ui";
import { useIbanga } from "@/lib/store";

export default function NotificationsPage() {
  const { currentUser } = useIbanga();
  if (!currentUser) return <WorkspaceLoading />;
  const notifications: never[] = [];
  const unread = 0;

  return (
    <RequireAuth>
      <DashboardShell role={currentUser.role}>
        <PageHeader
          eyebrow="Inbox"
          title="Notifications"
          subtitle="Booking, payment, and trip updates for your account."
        />
        <div className="mt-5 max-w-xs">
          <StatCard label="Unread" value={unread} hint={unread ? "Needs a look" : "All caught up"} accent={unread ? "warn" : "good"} />
        </div>
        <div className="mt-5">
          <DataTable
            exportName="ibanga-notifications"
            columns={[{ label: "When" }, { label: "Update" }, { label: "Detail" }, { label: "State" }]}
            filterLabel="All updates"
            rows={notifications}
            emptyMessage="No notifications yet."
          />
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
