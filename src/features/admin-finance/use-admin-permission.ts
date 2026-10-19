"use client";

import { useOps } from "@/hooks/use-ops";
import { useIbanga } from "@/lib/store";
import type { Permission } from "@/types/ops";

/**
 * Whether the signed-in administrator's role includes `permission`. Presentation only: the
 * service (and later the backend) enforces the same check on every call.
 */
export function useAdminPermission(permission: Permission): boolean {
  const { currentUser } = useIbanga();
  const { adminProfiles } = useOps();
  return adminProfiles.find((profile) => profile.userId === currentUser?.id)?.permissions.includes(permission) ?? false;
}
