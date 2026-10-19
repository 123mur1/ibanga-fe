"use client";

import { AdminPage } from "@/features/admin-platform/admin-page";
import { AnalyticsView } from "@/features/admin-platform/analytics-view";

export default function AdminReportsPage() {
  return (
    <AdminPage permission="reports">
      <AnalyticsView />
    </AdminPage>
  );
}
