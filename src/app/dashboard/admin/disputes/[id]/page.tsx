"use client";

import { useParams } from "next/navigation";
import { DisputeDetail } from "@/features/admin-cases/dispute-detail";
import { AdminPage } from "@/features/admin-platform/admin-page";

export default function AdminDisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <AdminPage permission="disputes">
      <DisputeDetail id={id} />
    </AdminPage>
  );
}
