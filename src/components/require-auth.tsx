"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WorkspaceLoading } from "@/components/loading";
import { dashboardPath, useIbanga } from "@/lib/store";
import type { Role } from "@/lib/types";

export function RequireAuth({
  role,
  children,
}: {
  role?: Role;
  children: React.ReactNode;
}) {
  const { currentUser, ready } = useIbanga();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!currentUser) {
      const here = `${pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(here)}`);
      return;
    }
    if (role && currentUser.role !== role) {
      router.replace(dashboardPath(currentUser.role));
    }
  }, [ready, currentUser, role, router, pathname]);

  if (!ready || !currentUser || (role && currentUser.role !== role)) {
    return <WorkspaceLoading />;
  }

  return <>{children}</>;
}
