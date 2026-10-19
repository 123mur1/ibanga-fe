"use client";

import { AdminPage } from "@/features/admin-platform/admin-page";
import { AdminsView } from "@/features/admin-platform/admins-view";

export default function AdminAdminsPage() {
  return (
    <AdminPage permission="admins">
      <AdminsView />
    </AdminPage>
  );
}
