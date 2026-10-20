import type { Role } from "@/lib/types";

/** Route prefix of the importer/owner portal a role works in. */
export function portalBase(role: Role): string {
  return role === "TRUCK_OWNER" ? "/dashboard/owner" : "/dashboard/importer";
}

export type PortalRole = Exclude<Role, "ADMIN" | "DRIVER">;
