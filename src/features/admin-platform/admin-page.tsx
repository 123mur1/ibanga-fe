"use client";

import { Notice } from "@/components/common/notices";
import { RoleShell } from "@/components/common/role-shell";
import { hasPermission } from "@/config/permissions";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useIbanga } from "@/lib/store";
import type { Permission } from "@/types/ops";

/**
 * Admin page wrapper: route guard, sidebar and a permission check. The check only controls what the
 * demonstration UI shows; the services repeat it and the backend must enforce it.
 */
export function AdminPage({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const actor = useActor();
  const { adminProfiles } = useOps();
  const allowed = hasPermission(adminProfiles.find((profile) => profile.userId === actor?.id)?.permissions, permission);
  return (
    <RoleShell role="ADMIN">
      {allowed ? (
        children
      ) : (
        <Notice tone="danger" title="Your administrator role does not include this area" action={{ href: "/dashboard/admin", label: "Back to overview" }}>
          Ask a super administrator to grant the &quot;{permission}&quot; permission.
        </Notice>
      )}
    </RoleShell>
  );
}

/** Resolves a user ID to a display name using the marketplace directory. */
export function useUserNames() {
  const { users } = useIbanga();
  return (id: string | undefined) => (id ? (users.find((user) => user.id === id)?.name ?? id) : "—");
}

/** A stable "now" for age calculations, fixed when the component mounts. */
export { useNow } from "./use-now";
