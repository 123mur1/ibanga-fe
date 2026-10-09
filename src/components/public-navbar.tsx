"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandLink } from "./brand";
import { LogoutConfirmationDialog } from "./logout-confirmation-dialog";
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

export function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const { currentUser, logout } = useIbanga();
  const router = useRouter();

  function handleLogout() {
    setMenuOpen(false);
    setLogoutConfirmationOpen(true);
  }

  function confirmLogout() {
    setLogoutConfirmationOpen(false);
    logout();
    router.push("/");
  }

  const accountAction = currentUser ? (
    <button
      type="button"
      onClick={handleLogout}
      className="hidden items-center gap-2 rounded-full border border-bad/25 bg-white px-5 py-2.5 text-sm font-semibold text-bad shadow-soft transition hover:border-bad/40 hover:bg-bad-soft md:inline-flex"
    >
      <AuthActionIcon action="logout" />
      Log out
    </button>
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
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-bad hover:bg-bad-soft"
              >
                <AuthActionIcon action="logout" />
                Log out
              </button>
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
