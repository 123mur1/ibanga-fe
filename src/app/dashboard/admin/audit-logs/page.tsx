"use client";

import { AdminPage } from "@/features/admin-platform/admin-page";
import { AuditView } from "@/features/admin-platform/audit-view";

export default function AdminAuditLogsPage() {
  return (
    <AdminPage permission="audit">
      <AuditView />
    </AdminPage>
  );
}
