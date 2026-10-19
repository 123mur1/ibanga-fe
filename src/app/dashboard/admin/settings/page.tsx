"use client";

import { AdminPage } from "@/features/admin-platform/admin-page";
import { SettingsView } from "@/features/admin-platform/settings-view";

export default function AdminSettingsPage() {
  return (
    <AdminPage permission="settings">
      <SettingsView />
    </AdminPage>
  );
}
