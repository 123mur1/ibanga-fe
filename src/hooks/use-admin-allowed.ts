"use client";

import { hasPermission } from "@/config/permissions";
import type { Permission } from "@/types/ops";
import { useActor } from "./use-actor";
import { useOps } from "./use-ops";

/**
 * Whether the signed-in administrator holds `permission`. Always true for non-admin users, so
 * shared components can call it unconditionally. Presentation only: the backend must enforce it.
 */
export function useAdminAllowed(permission: Permission): boolean {
  const actor = useActor();
  const { adminProfiles } = useOps();
  if (actor?.role !== "ADMIN") return true;
  return hasPermission(adminProfiles.find((profile) => profile.userId === actor.id)?.permissions, permission);
}
