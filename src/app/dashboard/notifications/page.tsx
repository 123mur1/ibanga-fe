"use client";

import { Suspense } from "react";
import { LoadingBlock } from "@/components/common/async-state";
import { NotificationCenter } from "@/features/notifications/notification-center";

export default function NotificationsPage() {
  // The centre reads ?tab= with useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense fallback={<LoadingBlock />}>
      <NotificationCenter />
    </Suspense>
  );
}
