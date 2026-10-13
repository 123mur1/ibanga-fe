"use client";

import Link from "next/link";
import { useState } from "react";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-navy shadow-soft hover:border-brand/30"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <div className="border-b border-line px-3 py-2.5">
            <p className="text-sm font-semibold text-navy">Notifications</p>
          </div>
          <p className="px-3 py-6 text-sm text-muted">You are up to date.</p>
          <Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="block border-t border-line px-3 py-2.5 text-center text-sm font-semibold text-brand">
            View all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
