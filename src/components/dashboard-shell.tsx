"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
    { href: "/dashboard/wallet", label: "Wallet", icon: "wallet" },
    { href: "/dashboard/importer/profile", label: "Profile", icon: "user" },
  ],
  TRUCK_OWNER: [
    { href: "/dashboard/owner", label: "Dashboard", icon: "grid" },
    { href: "/dashboard/owner/trucks", label: "My trucks", icon: "truck" },
    { href: "/dashboard/owner/requests", label: "Requests", icon: "inbox" },
    { href: "/dashboard/owner/trips", label: "Active trips", icon: "route" },
    { href: "/dashboard/owner/history", label: "History", icon: "history" },
    { href: "/dashboard/wallet", label: "Wallet", icon: "wallet" },
    { href: "/dashboard/owner/profile", label: "Profile", icon: "user" },
  ],
  ADMIN: [
    { href: "/dashboard/admin", label: "Dashboard", icon: "grid" },
    { href: "/dashboard/wallet", label: "Wallet", icon: "wallet" },
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
  wallet: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18m-5 5h2" />
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
  spark: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M5 5l2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M7.5 16.5 5 19" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
};

function NavIcon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 ${className}`}
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

function roleFlavor(role: Role) {
  if (role === "TRUCK_OWNER") return "Move cargo";
  if (role === "ADMIN") return "Marketplace watch";
  return "Ship cargo";
}

function roleTip(role: Role) {
  if (role === "TRUCK_OWNER")
    return "To free a truck from a trip, the importer must confirm the delivery.";
  if (role === "ADMIN")
    return "After dispute review, only the importer can confirm receipt and release the held payment.";
  return "Booking a truck holds it until the owner accepts or rejects.";
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const items = nav[role];
  const firstName = (currentUser?.name ?? "").split(" ")[0] || "there";

  useEffect(() => {
    if (!showLogoutConfirmation && !profileMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowLogoutConfirmation(false);
        setProfileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [profileMenuOpen, showLogoutConfirmation]);

  useEffect(() => {
    if (!profileMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !profileMenuRef.current?.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [profileMenuOpen]);

  function handleLogout() {
    setProfileMenuOpen(false);
    setShowLogoutConfirmation(false);
    setOpen(false);
    logout();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="hidden min-h-screen w-72 shrink-0 flex-col border-r border-line bg-card lg:flex">
          <div className="px-6 pb-5 pt-6">
            <BrandLink href="/" />
          </div>

          <div className="mx-4 mb-4 overflow-hidden rounded-2xl bg-linear-to-br from-brand via-brand-dark to-navy p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="relative">
                <Avatar src={currentUser?.photo} name={currentUser?.name ?? "User"} size="md" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-navy bg-good" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {currentUser?.name ?? "Loading…"}
                </p>
                <p className="truncate text-xs text-white/70">
                  {roleLabel(role)} · {roleFlavor(role)}
                </p>
              </div>
            </div>
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
                  className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
                    active
                      ? "bg-brand-soft font-semibold text-brand-dark"
                      : "text-muted hover:bg-background hover:text-navy"
                  }`}
                >
                  <NavIcon
                    name={item.icon}
                    className={active ? "text-brand" : "text-muted/70 group-hover:text-navy"}
                  />
                  {item.label}
                  {active ? (
                    <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-brand" />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mx-4 mb-4 rounded-2xl border border-brand/15 bg-brand-soft/50 p-4">
            <div className="flex items-center gap-2 text-brand-dark">
              <NavIcon name="spark" className="h-4 w-4" />
              <p className="text-xs font-semibold">Good to know</p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-navy/70">
              {roleTip(role)}
            </p>
          </div>

          <div className="m-3 flex items-center justify-end border-t border-line pt-4 px-1">
            <span className="text-xs text-muted/70">v1 · iBanga</span>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-background/80 px-4 py-3.5 backdrop-blur lg:px-8">
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

            <div className="hidden items-center gap-2 text-sm text-muted lg:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="font-medium text-navy">Good {morning()}, {firstName}.</span>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-navy shadow-soft transition hover:-translate-y-0.5 hover:border-navy/20"
              >
                <NavIcon name="home" className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  aria-label="Open profile menu"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  onClick={() => setProfileMenuOpen((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-2.5 shadow-soft transition hover:border-brand/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:pr-3.5"
                >
                  <Avatar
                    src={currentUser?.photo}
                    name={currentUser?.name ?? "User"}
                    size="sm"
                  />
                  <span className="hidden max-w-28 truncate text-sm font-semibold text-navy sm:inline">
                    {currentUser?.name}
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className={`text-muted transition-transform ${profileMenuOpen ? "rotate-180" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {profileMenuOpen ? (
                  <div
                    role="menu"
                    aria-label="Profile options"
                    className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-card"
                  >
                    <div className="border-b border-line px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-navy">
                        {currentUser?.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {currentUser?.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setShowLogoutConfirmation(true);
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-bad transition hover:bg-bad-soft focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-bad"
                    >
                      <NavIcon name="logout" className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          {open ? (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />
              <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card shadow-card">
                <div className="flex items-center justify-between px-5 py-5">
                  <BrandLink />
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-navy"
                    onClick={() => setOpen(false)}
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
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>
                <div className="mx-4 mb-4 overflow-hidden rounded-2xl bg-linear-to-br from-brand via-brand-dark to-navy p-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={currentUser?.photo} name={currentUser?.name ?? "User"} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {currentUser?.name}
                      </p>
                      <p className="truncate text-xs text-white/70">
                        {roleLabel(role)}
                      </p>
                    </div>
                  </div>
                </div>
                <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
                  {items.map((item) => {
                    const active =
                      pathname === item.href ||
                      (item.href !== items[0].href && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                          active
                            ? "bg-brand-soft text-brand-dark"
                            : "text-navy hover:bg-background"
                        }`}
                      >
                        <NavIcon
                          name={item.icon}
                          className={active ? "text-brand" : "text-muted"}
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          ) : null}

          <main className="mx-auto w-full max-w-360 px-4 py-6 lg:px-7 lg:py-8">{children}</main>
        </div>
      </div>
      {showLogoutConfirmation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cancel logout"
            className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirmation(false)}
          />
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-description"
            className="relative z-10 w-full max-w-sm rounded-3xl border border-line bg-card p-6 shadow-card"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bad-soft text-bad">
              <NavIcon name="logout" className="h-5 w-5" />
            </div>
            <h2
              id="logout-dialog-title"
              className="mt-4 font-display text-xl text-navy"
            >
              Log out of iBanga?
            </h2>
            <p id="logout-dialog-description" className="mt-2 text-sm leading-relaxed text-muted">
              Are you sure you want to log out? You can sign back in at any time.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setShowLogoutConfirmation(false)}
                className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-bad px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bad"
              >
                Log out
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function morning() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}