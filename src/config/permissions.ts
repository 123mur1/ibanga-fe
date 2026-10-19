/**
 * Frontend role and permission model, used ONLY to decide what the demonstration UI shows.
 *
 * SECURITY NOTE: hiding a menu item or button is not access control. The backend must enforce
 * every role, ownership and permission rule on every request. A user must never be able to read
 * or change another user's private records just because a route is reachable in the browser.
 */
import type { Role } from "@/lib/types";
import type { AdminRoleName, Permission } from "@/types/ops";

export const ALL_PERMISSIONS: Permission[] = [
  "users",
  "verifications",
  "trucks",
  "drivers",
  "cargo",
  "bookings",
  "shipments",
  "payments",
  "settlements",
  "refunds",
  "disputes",
  "incidents",
  "insurance",
  "documents",
  "reconciliation",
  "reports",
  "announcements",
  "support",
  "audit",
  "settings",
  "admins",
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  users: "User management",
  verifications: "Verification requests",
  trucks: "Truck management",
  drivers: "Driver management",
  cargo: "Cargo requests",
  bookings: "Bookings",
  shipments: "Shipments & tracking",
  payments: "Payments",
  settlements: "Settlements & payouts",
  refunds: "Refunds & cancellations",
  disputes: "Disputes & claims",
  incidents: "Incident management",
  insurance: "Insurance claims",
  documents: "Document expiry",
  reconciliation: "Financial reconciliation",
  reports: "Reports & analytics",
  announcements: "Notifications & announcements",
  support: "Customer support",
  audit: "Audit logs",
  settings: "System settings",
  admins: "Admin users & permissions",
};

export const ADMIN_ROLE_PRESETS: Record<AdminRoleName, { label: string; description: string; permissions: Permission[] }> = {
  SUPER_ADMIN: {
    label: "Super administrator",
    description: "Full access to every module, settings and administrator permissions.",
    permissions: ALL_PERMISSIONS,
  },
  OPERATIONS: {
    label: "Operations manager",
    description: "Runs verification, trucks, drivers, shipments, incidents and document expiry.",
    permissions: [
      "verifications",
      "trucks",
      "drivers",
      "cargo",
      "bookings",
      "shipments",
      "incidents",
      "insurance",
      "documents",
      "disputes",
      "reports",
      "announcements",
      "support",
    ],
  },
  FINANCE: {
    label: "Finance officer",
    description: "Reviews payments, settlements, refunds, cancellations and reconciliation.",
    permissions: ["payments", "settlements", "refunds", "reconciliation", "bookings", "reports", "audit"],
  },
  SUPPORT: {
    label: "Customer support",
    description: "Handles support tickets, disputes and notifications.",
    permissions: ["support", "disputes", "bookings", "shipments", "announcements"],
  },
};

export function hasPermission(permissions: Permission[] | undefined, needed: Permission | undefined): boolean {
  if (!needed) return true;
  return Boolean(permissions?.includes(needed));
}

/** Role guard used by route components. Mirrors, but does not replace, server-side checks. */
export function canAccessRole(userRole: Role | undefined, required: Role): boolean {
  return userRole === required;
}
