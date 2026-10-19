"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { RoleShell } from "@/components/common/role-shell";
import { Tabs } from "@/components/common/tabs";
import { PageHeader } from "@/components/ui";
import { useUnreadCount } from "@/hooks/use-unread";
import { Announcements } from "./announcements";
import { NotificationList } from "./notification-list";
import { NotificationPreferences } from "./preferences";

type Tab = "notifications" | "preferences";

/** Shared by every role. `?tab=preferences` opens the preferences tab directly. */
export function NotificationCenter() {
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>(params.get("tab") === "preferences" ? "preferences" : "notifications");
  const unread = useUnreadCount();

  return (
    <RoleShell>
      <PageHeader eyebrow="Inbox" title="Notifications" subtitle="Updates about your bookings, payments, shipments, documents and disputes." />
      <Announcements />
      <div className="mt-6">
        <Tabs<Tab>
          label="Notification sections"
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "notifications", label: "Notifications", count: unread },
            { key: "preferences", label: "Preferences" },
          ]}
        />
      </div>
      <div className="mt-5" role="tabpanel">
        {tab === "notifications" ? <NotificationList /> : <NotificationPreferences />}
      </div>
    </RoleShell>
  );
}
