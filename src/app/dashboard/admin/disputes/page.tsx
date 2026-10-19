"use client";

import { Suspense } from "react";
import { LoadingBlock } from "@/components/common/async-state";
import { DisputeQueue } from "@/features/admin-cases/dispute-queue";
import { AdminPage } from "@/features/admin-platform/admin-page";

export default function AdminDisputesPage() {
  return (
    <AdminPage permission="disputes">
      <Suspense fallback={<LoadingBlock />}>
        <DisputeQueue />
      </Suspense>
    </AdminPage>
  );
}
