"use client";

import { StatusBars } from "@/components/charts";
import { WorkspaceLoading } from "@/components/loading";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { DataTable, PageHeader, StatCard, formatDateTime } from "@/components/ui";
import { useIbanga } from "@/lib/store";

export default function NotificationsPage() {
  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead } = useIbanga();
  if (!currentUser) return <WorkspaceLoading />;
  const unread = notifications.filter((item) => !item.read).length;

  return (
    <RequireAuth>
      <DashboardShell role={currentUser.role}>
        <PageHeader
          eyebrow="Inbox"
          title="Notifications"
          subtitle="Booking, payment, and trip updates for your account."
          actions={
            <button type="button" onClick={markAllNotificationsRead} className="text-sm font-semibold text-brand">
              Mark all read
            </button>
          }
        />
        <div className="mt-5 max-w-xs">
          <StatCard label="Unread" value={unread} hint={unread ? "Needs a look" : "All caught up"} accent={unread ? "warn" : "good"} />
        </div>
        <div className="mt-5">
          <DataTable
            exportName="ibanga-notifications"
            columns={[{ label: "When" }, { label: "Update" }, { label: "Detail" }, { label: "State" }]}
            filterLabel="All updates"
            rows={notifications.map((item) => ({
              id: item.id,
              searchText: `${item.title} ${item.body}`,
              filterValue: item.read ? "READ" : "UNREAD",
              exportValues: [formatDateTime(item.createdAt), item.title, item.body, item.read ? "Read" : "Unread"],
              cells: [
                formatDateTime(item.createdAt),
                <button key={`${item.id}-title`} type="button" onClick={() => markNotificationRead(item.id)} className="text-left font-semibold text-navy">{item.title}</button>,
                <span key={`${item.id}-body`} className="whitespace-normal">{item.body}</span>,
                <span key={`${item.id}-state`} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.read ? "bg-line text-muted" : "bg-warn-soft text-warn"}`}>{item.read ? "Read" : "Unread"}</span>,
              ],
            }))}
            emptyMessage="No notifications yet."
          />
        </div>
        <div className="mt-6 max-w-md">
          <StatusBars
            title="Inbox mix"
            items={[
              { label: "Unread", value: unread, tone: "warn" },
              { label: "Read", value: notifications.length - unread, tone: "good" },
            ]}
          />
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
