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
  const { currentUser, ready, loadError, logout } = useIbanga();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready || loadError) return;
    if (!currentUser) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (role && currentUser.role !== role) {
      router.replace(dashboardPath(currentUser.role));
    }
  }, [ready, currentUser, role, router, pathname, loadError]);

  if (ready && loadError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p role="alert" className="max-w-xl rounded-xl border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">
          {loadError}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
          {currentUser ? (
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-navy"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!ready || !currentUser || (role && currentUser.role !== role)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted">
        Loading workspace…
      </div>
    );
  }

  return <>{children}</>;
}
