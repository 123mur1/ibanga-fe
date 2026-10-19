/**
 * Sidebar navigation for each authenticated experience. Every `href` must resolve to a real page
 * (checked by `npm run check:routes`). Admin items carry a `permission` so the menu can be
 * filtered per administrator role. Remember: hiding a link is presentation only, the backend must
 * enforce access.
 */
import type { Role } from "@/lib/types";
import type { Permission } from "@/types/ops";

export type NavIconName =
  | "grid"
  | "users"
  | "truck"
  | "calendar"
  | "alert"
  | "card"
  | "wallet"
  | "pin"
  | "search"
  | "inbox"
  | "history"
  | "refund"
  | "file"
  | "bell"
  | "lifebuoy"
  | "chart"
  | "shield"
  | "user"
  | "settings"
  | "clipboard"
  | "package"
  | "steering"
  | "receipt"
  | "scale"
  | "megaphone"
  | "scroll"
  | "key"
  | "umbrella"
  | "clock"
  | "ban"
  | "camera"
  | "sparkle"
  | "route";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  /** Admin permission needed to see this item. */
  permission?: Permission;
  /** Opens a public page outside the dashboard. */
  external?: boolean;
  /** Shows a live unread count next to the label. */
  badge?: "unreadNotifications";
};

export type NavGroup = { label?: string; items: NavItem[] };

const importer = "/dashboard/importer";
const owner = "/dashboard/owner";
const admin = "/dashboard/admin";

export const NAVIGATION: Record<Role, NavGroup[]> = {
  IMPORTER: [
    { items: [{ href: importer, label: "Overview", icon: "grid" }] },
    {
      label: "Shipping",
      items: [
        { href: `${importer}/cargo-requests`, label: "Cargo requests", icon: "clipboard" },
        { href: "/#available-trucks", label: "Find trucks", icon: "search", external: true },
        { href: `${importer}/bookings`, label: "Bookings", icon: "calendar" },
        { href: `${importer}/shipments`, label: "Shipments & tracking", icon: "pin" },
      ],
    },
    {
      label: "Money",
      items: [
        { href: `${importer}/payments`, label: "Payments", icon: "card" },
        { href: `${importer}/refunds`, label: "Refunds", icon: "refund" },
      ],
    },
    {
      label: "Records & help",
      items: [
        { href: `${importer}/disputes`, label: "Disputes", icon: "alert" },
        { href: `${importer}/documents`, label: "Documents", icon: "file" },
        { href: "/dashboard/notifications", label: "Notifications", icon: "bell", badge: "unreadNotifications" },
        { href: `${importer}/support`, label: "Support tickets", icon: "lifebuoy" },
        { href: `${importer}/reports`, label: "Reports & history", icon: "chart" },
      ],
    },
    {
      label: "Account",
      items: [
        { href: `${importer}/profile`, label: "Profile & settings", icon: "user" },
        { href: "/dashboard/future", label: "Planned features", icon: "sparkle" },
      ],
    },
  ],

  TRUCK_OWNER: [
    { items: [{ href: owner, label: "Overview", icon: "grid" }] },
    {
      label: "Work",
      items: [
        { href: `${owner}/opportunities`, label: "Cargo opportunities", icon: "package" },
        { href: `${owner}/bookings`, label: "Bookings", icon: "calendar" },
        { href: `${owner}/shipments`, label: "Active shipments", icon: "route" },
        { href: "/dashboard/tracking", label: "Shipment tracking", icon: "pin" },
        { href: `${owner}/delivery-evidence`, label: "Delivery evidence", icon: "camera" },
      ],
    },
    {
      label: "Fleet",
      items: [
        { href: `${owner}/trucks`, label: "My trucks", icon: "truck" },
        { href: `${owner}/drivers`, label: "Drivers", icon: "steering" },
        { href: `${owner}/documents`, label: "Insurance & documents", icon: "umbrella" },
        { href: `${owner}/incidents`, label: "Accidents & incidents", icon: "alert" },
      ],
    },
    {
      label: "Money",
      items: [
        { href: `${owner}/earnings`, label: "Earnings & settlements", icon: "receipt" },
        { href: `${owner}/payouts`, label: "Payout history", icon: "wallet" },
        { href: `${owner}/payments`, label: "Payments", icon: "card" },
        { href: `${owner}/refunds`, label: "Refunds", icon: "refund" },
      ],
    },
    {
      label: "More",
      items: [
        { href: "/dashboard/notifications", label: "Notifications", icon: "bell", badge: "unreadNotifications" },
        { href: `${owner}/disputes`, label: "Disputes", icon: "scale" },
        { href: `${owner}/support`, label: "Support tickets", icon: "lifebuoy" },
        { href: `${owner}/reports`, label: "Performance reports", icon: "chart" },
        { href: `${owner}/history`, label: "Trip history", icon: "history" },
        { href: `${owner}/profile`, label: "Profile & settings", icon: "user" },
        { href: "/dashboard/future", label: "Planned features", icon: "sparkle" },
      ],
    },
  ],

  ADMIN: [
    { items: [{ href: admin, label: "Overview", icon: "grid" }] },
    {
      label: "People & verification",
      items: [
        { href: `${admin}/users`, label: "User management", icon: "users", permission: "users" },
        { href: `${admin}/verifications`, label: "Verification requests", icon: "shield", permission: "verifications" },
        { href: `${admin}/trucks`, label: "Truck management", icon: "truck", permission: "trucks" },
        { href: `${admin}/drivers`, label: "Driver management", icon: "steering", permission: "drivers" },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: `${admin}/cargo-requests`, label: "Cargo requests", icon: "clipboard", permission: "cargo" },
        { href: `${admin}/bookings`, label: "Bookings", icon: "calendar", permission: "bookings" },
        { href: `${admin}/shipments`, label: "Shipments & tracking", icon: "pin", permission: "shipments" },
        { href: `${admin}/incidents`, label: "Accident & incidents", icon: "alert", permission: "incidents" },
        { href: `${admin}/document-expiry`, label: "Document expiry", icon: "clock", permission: "documents" },
      ],
    },
    {
      label: "Money",
      items: [
        { href: `${admin}/payments`, label: "Payments", icon: "card", permission: "payments" },
        { href: `${admin}/settlements`, label: "Settlements & payouts", icon: "receipt", permission: "settlements" },
        { href: `${admin}/refunds`, label: "Refund management", icon: "refund", permission: "refunds" },
        { href: `${admin}/cancellations`, label: "Cancellation management", icon: "ban", permission: "refunds" },
        { href: `${admin}/reconciliation`, label: "Financial reconciliation", icon: "scale", permission: "reconciliation" },
        { href: "/dashboard/wallet", label: "Platform wallet", icon: "wallet", permission: "payments" },
      ],
    },
    {
      label: "Cases",
      items: [
        { href: `${admin}/disputes`, label: "Disputes & claims", icon: "scale", permission: "disputes" },
        { href: `${admin}/insurance-claims`, label: "Insurance claims", icon: "umbrella", permission: "insurance" },
        { href: `${admin}/support`, label: "Customer support", icon: "lifebuoy", permission: "support" },
      ],
    },
    {
      label: "Platform",
      items: [
        { href: `${admin}/reports`, label: "Reports & analytics", icon: "chart", permission: "reports" },
        { href: `${admin}/announcements`, label: "Notifications & announcements", icon: "megaphone", permission: "announcements" },
        { href: `${admin}/audit-logs`, label: "Audit logs", icon: "scroll", permission: "audit" },
        { href: `${admin}/settings`, label: "System settings", icon: "settings", permission: "settings" },
        { href: `${admin}/admins`, label: "Admin users & permissions", icon: "key", permission: "admins" },
        { href: "/dashboard/notifications", label: "My notifications", icon: "bell", badge: "unreadNotifications" },
        { href: `${admin}/profile`, label: "Profile", icon: "user" },
        { href: "/dashboard/future", label: "Planned features", icon: "sparkle" },
      ],
    },
  ],
};

export function flattenNav(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((group) => group.items);
}

export function profilePathFor(role: Role): string {
  return role === "TRUCK_OWNER" ? `${owner}/profile` : role === "ADMIN" ? `${admin}/profile` : `${importer}/profile`;
}
