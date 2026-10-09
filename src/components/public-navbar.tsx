"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandLink } from "./brand";
import { LogoutConfirmationDialog } from "./logout-confirmation-dialog";
import { Avatar } from "./photos";
import { dashboardPath, useIbanga } from "@/lib/store";

const links = [
  { href: "/#home", label: "Home" },
  { href: "/#available-trucks", label: "Available cars" },
  { href: "/#about", label: "About us" },
  { href: "/#contact", label: "Contacts" },
];

function AuthActionIcon({ action }: { action: "login" | "logout" }) {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {action === "login" ? (
        <>
          <path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
          <path d="M10 16l4-4-4-4m4 4H3" />
        </>
      ) : (
        <>
          <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
          <path d="m16 16 4-4-4-4m4 4H9" />
        </>
      )}
    </svg>
  );
}

function accountRoleLabel(role: NonNullable<ReturnType<typeof useIbanga>["currentUser"]>["role"]) {
  if (role === "TRUCK_OWNER") return "Truck owner";
  if (role === "ADMIN") return "Admin";
  return "Importer";
}

export function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { currentUser, logout } = useIbanga();
  const router = useRouter();
  const profilePath = currentUser?.role === "TRUCK_OWNER"
    ? "/dashboard/owner/profile"
    : currentUser?.role === "ADMIN"
      ? "/dashboard/admin/profile"
      : "/dashboard/importer/profile";

  function handleLogout() {
    setMenuOpen(false);
    setProfileOpen(false);
    setLogoutConfirmationOpen(true);
  }

  function confirmLogout() {
    setLogoutConfirmationOpen(false);
    setProfileOpen(false);
    logout();
    router.push("/");
  }

  const accountAction = currentUser ? (
    <div className="relative hidden md:block">
      <button
        type="button"
        aria-expanded={profileOpen}
        aria-haspopup="menu"
        onClick={() => setProfileOpen((value) => !value)}
        className="flex max-w-64 items-center gap-3 rounded-xl border border-line bg-white px-2.5 py-2 text-left shadow-soft transition hover:border-brand/30"
      >
        <Avatar src={currentUser.photo} name={currentUser.name} size="sm" />
        <span className="block min-w-0 max-w-36">
          <span className="block truncate text-sm font-semibold leading-5 text-navy">{currentUser.name}</span>
          <span className="block text-xs text-muted">{accountRoleLabel(currentUser.role)}</span>
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-muted transition ${profileOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {profileOpen ? (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-line bg-white p-1.5 shadow-card">
          <Link
            role="menuitem"
            href={profilePath}
            onClick={() => setProfileOpen(false)}
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-brand-soft"
          >
            Profile
          </Link>
          <Link
            role="menuitem"
            href="/dashboard/settings"
            onClick={() => setProfileOpen(false)}
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-brand-soft"
          >
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-bad hover:bg-bad-soft"
          >
            <AuthActionIcon action="logout" />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  ) : (
    <a
      href="/login"
      className="hidden items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/15 transition hover:bg-brand-dark md:inline-flex"
    >
      <AuthActionIcon action="login" />
      Login
    </a>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <BrandLink />
          <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-slate-600 transition hover:text-brand"
              >
                {link.label}
              </a>
            ))}
            {currentUser ? (
              <Link
                href={dashboardPath(currentUser.role)}
                className="text-sm font-semibold text-slate-600 transition hover:text-brand"
              >
                Dashboard
              </Link>
            ) : null}
          </nav>
          {accountAction}
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
        {menuOpen ? (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="space-y-1 border-t border-slate-100 bg-white px-4 py-3 md:hidden"
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand"
              >
                {link.label}
              </a>
            ))}
            {currentUser ? (
              <Link
                href={dashboardPath(currentUser.role)}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand"
              >
                Dashboard
              </Link>
            ) : null}
            {currentUser ? (
              <div className="mt-2 border-t border-line pt-3">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar src={currentUser.photo} name={currentUser.name} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-navy">{currentUser.name}</span>
                    <span className="block text-xs text-muted">{accountRoleLabel(currentUser.role)}</span>
                  </span>
                </div>
                <Link
                  href={profilePath}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand"
                >
                  Profile
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand"
                >
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-bad hover:bg-bad-soft"
                >
                  <AuthActionIcon action="logout" />
                  Log out
                </button>
              </div>
            ) : (
              <a
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-brand hover:bg-brand-soft"
              >
                <AuthActionIcon action="login" />
                Login
              </a>
            )}
          </nav>
        ) : null}
      </header>
      {logoutConfirmationOpen ? (
        <LogoutConfirmationDialog
          userName={currentUser?.name}
          onCancel={() => setLogoutConfirmationOpen(false)}
          onConfirm={confirmLogout}
        />
      ) : null}
    </>
  );
}
