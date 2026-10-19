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
    {
      items: [
        { href: importer, label: "Overview", icon: "grid" },
        { href: `${importer}/bookings`, label: "My bookings", icon: "calendar" },
        { href: "/dashboard/tracking", label: "Live cargo", icon: "pin" },
        { href: `${importer}/payments`, label: "Payments", icon: "card" },
        { href: `${importer}/refunds`, label: "Refunds", icon: "refund" },
      ],
    },
  ],

  TRUCK_OWNER: [
    {
      items: [
        { href: owner, label: "Dashboard", icon: "grid" },
        { href: `${owner}/trucks`, label: "My trucks", icon: "truck" },
        { href: `${owner}/bookings`, label: "Bookings", icon: "calendar" },
        { href: `${owner}/history`, label: "History", icon: "history" },
        { href: "/dashboard/tracking", label: "Live cargo", icon: "pin" },
        { href: `${owner}/payments`, label: "Payments", icon: "card" },
        { href: `${owner}/refunds`, label: "Refunds", icon: "refund" },
      ],
    },
  ],

  ADMIN: [
    {
      items: [
        { href: admin, label: "Overview", icon: "grid" },
        { href: `${admin}/users`, label: "Users", icon: "users", permission: "users" },
        { href: `${admin}/trucks`, label: "Trucks", icon: "truck", permission: "trucks" },
        { href: `${admin}/bookings`, label: "Bookings", icon: "calendar", permission: "bookings" },
        { href: `${admin}/payments`, label: "Payments", icon: "card", permission: "payments" },
        { href: `${admin}/disputes`, label: "Disputes", icon: "scale", permission: "disputes" },
        { href: `${admin}/reports`, label: "Reports", icon: "chart", permission: "reports" },
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
