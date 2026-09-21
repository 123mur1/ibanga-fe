"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BrandLink } from "./brand";
import { Avatar } from "./photos";
import { useIbanga } from "@/lib/store";
import type { Role } from "@/lib/types";

const nav: Record<Role, { href: string; label: string }[]> = {
  IMPORTER: [
    { href: "/dashboard/importer", label: "Overview" },
    { href: "/trucks", label: "Find trucks" },
    { href: "/dashboard/importer/bookings", label: "My bookings" },
    { href: "/dashboard/importer/profile", label: "Profile" },
  ],
  TRUCK_OWNER: [
    { href: "/dashboard/owner", label: "Dashboard" },
    { href: "/dashboard/owner/trucks", label: "My trucks" },
    { href: "/dashboard/owner/requests", label: "Requests" },
    { href: "/dashboard/owner/trips", label: "Active trips" },
    { href: "/dashboard/owner/history", label: "History" },
    { href: "/dashboard/owner/profile", label: "Profile" },
  ],
  ADMIN: [
    { href: "/dashboard/admin", label: "Dashboard" },
    { href: "/dashboard/admin/users", label: "Users" },
    { href: "/dashboard/admin/trucks", label: "Trucks" },
    { href: "/dashboard/admin/bookings", label: "Bookings" },
    { href: "/dashboard/admin/disputes", label: "Disputes" },
  ],
};

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
        <aside className="hidden min-h-screen w-64 shrink-0 flex-col bg-navy text-white lg:flex">
          <div className="px-5 py-5">
            <BrandLink href="/" light />
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/50">
              {roleLabel(role)}
            </p>
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
                  className={`rounded-xl px-3 py-2.5 text-sm ${
                    active
                      ? "bg-white/12 font-semibold text-white"
                      : "text-white/70 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3">
              <Avatar src={currentUser?.photo} name={currentUser?.name ?? "User"} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{currentUser?.name}</p>
                <p className="truncate text-xs text-white/50">{currentUser?.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="mt-3 text-sm text-white/70 hover:text-white"
            >
              Log out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-card/90 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                className="rounded-lg border border-line px-3 py-1.5 text-sm"
                onClick={() => setOpen((v) => !v)}
              >
                Menu
              </button>
              <BrandLink />
            </div>
            <p className="hidden text-sm text-muted lg:block">
              A booking holds the truck. Reject it and it is available again.
            </p>
            <Link
              href="/"
              className="text-sm font-medium text-brand hover:text-brand-dark"
            >
              Home
            </Link>
          </header>

          {open ? (
            <div className="border-b border-line bg-card px-4 py-3 lg:hidden">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-2 text-sm text-navy"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}

          <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
