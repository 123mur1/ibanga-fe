"use client";

import { TicketQueue } from "@/features/admin-cases/ticket-queue";
import { AdminPage } from "@/features/admin-platform/admin-page";

export default function AdminSupportPage() {
  return (
    <AdminPage permission="support">
      <TicketQueue />
    </AdminPage>
  );
}
