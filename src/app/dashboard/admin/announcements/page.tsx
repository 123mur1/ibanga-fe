"use client";

import { AdminPage } from "@/features/admin-platform/admin-page";
import { AnnouncementsView } from "@/features/admin-platform/announcements-view";

export default function AdminAnnouncementsPage() {
  return (
    <AdminPage permission="announcements">
      <AnnouncementsView />
    </AdminPage>
  );
}
