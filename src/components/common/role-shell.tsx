"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { WorkspaceLoading } from "@/components/loading";
import { RequireAuth } from "@/components/require-auth";
import { useIbanga } from "@/lib/store";
import type { Role } from "@/lib/types";

/**
 * Page wrapper for authenticated screens: route guard + role-specific sidebar. Pass `role` to
 * restrict the page to one role. Omit it for shared pages (notifications, planned features) that
 * adapt to whoever is signed in.
 *
 * Frontend guards are for demonstration only. The backend must enforce access on every request.
 */
export function RoleShell({ role, children }: { role?: Role; children: React.ReactNode }) {
  const { currentUser } = useIbanga();
  return (
    <RequireAuth role={role}>
      {currentUser ? <DashboardShell role={role ?? currentUser.role}>{children}</DashboardShell> : <WorkspaceLoading />}
    </RequireAuth>
  );
}
