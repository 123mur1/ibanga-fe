"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BrandLink } from "./brand";
import { Avatar } from "./photos";
import { useIbanga } from "@/lib/store";
import type { Role } from "@/lib/types";

type NavItem = { href: string; label: string; icon: string };

const nav: Record<Role, NavItem[]> = {
  IMPORTER: [
    { href: "/dashboard/importer", label: "Overview", icon: "grid" },
    { href: "/trucks", label: "Find trucks", icon: "search" },
    { href: "/dashboard/importer/bookings", label: "My bookings", icon: "calendar" },
    { href: "/dashboard/importer/profile", label: "Profile", icon: "user" },
  ],
  TRUCK_OWNER: [
    { href: "/dashboard/owner", label: "Dashboard", icon: "grid" },
    { href: "/dashboard/owner/trucks", label: "My trucks", icon: "truck" },
    { href: "/dashboard/owner/requests", label: "Requests", icon: "inbox" },
    { href: "/dashboard/owner/trips", label: "Active trips", icon: "route" },
    { href: "/dashboard/owner/history", label: "History", icon: "history" },
    { href: "/dashboard/owner/profile", label: "Profile", icon: "user" },
  ],
  ADMIN: [
    { href: "/dashboard/admin", label: "Dashboard", icon: "grid" },
    { href: "/dashboard/admin/users", label: "Users", icon: "users" },
    { href: "/dashboard/admin/trucks", label: "Trucks", icon: "truck" },
    { href: "/dashboard/admin/bookings", label: "Bookings", icon: "calendar" },
    { href: "/dashboard/admin/disputes", label: "Disputes", icon: "alert" },
  ],
};

const iconPaths: Record<string, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.8-3.8" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 9.5h18M8 3v4m8-4v4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 13h5l1.5 2.5h5L16 13h5" />
      <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M8.5 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
    </>
  ),
  history: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 1 2.5 6" />
      <path d="M3.5 15.5V11H8" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.2a3.5 3.5 0 0 1 0 5.6M17 14.5a6 6 0 0 1 4 5.5" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 9.5V14" />
      <path d="M12 17.5h.01" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5.5 9.5V20h13V9.5" />
    </>
  ),
  logout: (
    <>
      <path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="M15 8l4 4-4 4M19 12H9" />
    </>
  ),
};

function NavIcon({ name, className = "h-4.5 w-4.5" }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

function roleLabel(role: Role) {
  if (role === "TRUCK_OWNER") return "Truck owner";
  if (role === "ADMIN") return "Admin";
  return "Importer";
}

export function DashboardShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { currentUser, logout } = useIbanga();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = nav[role];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-line bg-card lg:flex">
          <div className="px-5 pb-4 pt-6">
            <BrandLink href="/" />
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              {roleLabel(role)} workspace
            </span>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-3">
            {items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== items[0].href && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-brand-soft font-semibold text-brand-dark"
                      : "text-muted hover:bg-background hover:text-navy"
                  }`}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                  {active ? (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" />
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <div className="m-3 rounded-2xl border border-line bg-background p-4">
            <div className="flex items-center gap-3">
              <Avatar src={currentUser?.photo} name={currentUser?.name ?? "User"} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy">{currentUser?.name}</p>
                <p className="truncate text-xs text-muted">{currentUser?.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-0 text-sm font-medium text-muted transition hover:text-bad"
            >
              <NavIcon name="logout" className="h-4 w-4" />
              Log out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-card/80 px-4 py-3.5 backdrop-blur lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                aria-label="Open menu"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-navy shadow-soft"
                onClick={() => setOpen((v) => !v)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M4 7h16M4 12h16M4 17h10" />
                </svg>
              </button>
              <BrandLink />
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-line bg-background px-3.5 py-1.5 text-xs font-medium text-muted lg:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              A booking holds the truck. Reject it and it is available again.
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-navy shadow-soft transition hover:-translate-y-0.5 hover:border-navy/20"
            >
              <NavIcon name="home" className="h-4 w-4" />
              Home
            </Link>
          </header>

          {open ? (
            <div className="border-b border-line bg-white px-4 py-2 lg:hidden">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy transition hover:bg-background"
                >
                  <NavIcon name={item.icon} className="h-4.5 w-4.5 text-muted" />
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}

          <main className="px-4 py-8 lg:px-8 lg:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}