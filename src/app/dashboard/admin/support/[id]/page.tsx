"use client";

import { useParams } from "next/navigation";
import { TicketDetail } from "@/features/admin-cases/ticket-detail";
import { AdminPage } from "@/features/admin-platform/admin-page";

export default function AdminSupportDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <AdminPage permission="support">
      <TicketDetail id={id} />
    </AdminPage>
  );
}
