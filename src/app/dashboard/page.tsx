"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { dashboardPath, useIbanga } from "@/lib/store";

export default function DashboardIndex() {
  const { currentUser, ready } = useIbanga();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    router.replace(dashboardPath(currentUser.role));
  }, [ready, currentUser, router]);

  return <div className="p-8 text-muted">Opening your workspace…</div>;
}
