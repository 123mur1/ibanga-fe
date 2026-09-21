"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (role && currentUser.role !== role) {
      router.replace(dashboardPath(currentUser.role));
    }
  }, [ready, currentUser, role, router, pathname]);

  if (!ready || !currentUser || (role && currentUser.role !== role)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted">
        Loading workspace…
      </div>
    );
  }

  return <>{children}</>;
}
