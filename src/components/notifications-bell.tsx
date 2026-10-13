"use client";

import Link from "next/link";
import { useState } from "react";
import { useIbanga } from "@/lib/store";
import { formatDateTime } from "./ui";

export function NotificationsBell() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useIbanga();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((item) => !item.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-navy shadow-soft hover:border-brand/30"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unread ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-bad px-1 text-[11px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
            <p className="text-sm font-semibold text-navy">Notifications</p>
            <button type="button" onClick={markAllNotificationsRead} className="text-sm font-semibold text-brand">
              Mark read
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-3 py-6 text-sm text-muted">You are up to date.</li>
            ) : notifications.slice(0, 8).map((item) => (
              <li key={item.id} className={item.read ? "bg-white" : "bg-brand-soft/40"}>
                <Link
                  href={item.href || "/dashboard/notifications"}
                  onClick={() => {
                    markNotificationRead(item.id);
                    setOpen(false);
                  }}
                  className="block px-3 py-3 hover:bg-background"
                >
                  <p className="text-sm font-semibold text-navy">{item.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{item.body}</p>
                  <p className="mt-1 text-xs text-muted">{formatDateTime(item.createdAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="block border-t border-line px-3 py-2.5 text-center text-sm font-semibold text-brand">
            View all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
