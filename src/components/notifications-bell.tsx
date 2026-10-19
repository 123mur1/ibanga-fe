"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { formatRelative } from "@/lib/format";
import { services } from "@/services";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const actor = useActor();
  const { notifications } = useOps();
  const mine = useMemo(
    () => (actor ? notifications.filter((item) => item.userId === actor.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : []),
    [actor, notifications],
  );
  const unread = mine.filter((item) => !item.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-navy shadow-soft hover:border-brand/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
            <p className="text-sm font-semibold text-navy">Notifications</p>
            {unread > 0 && actor ? (
              <button type="button" onClick={() => void services.notifications.markAllRead(actor.id)} className="text-xs font-semibold text-brand hover:text-brand-dark">
                Mark all read
              </button>
            ) : null}
          </div>
          {mine.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted">You are up to date.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-line overflow-y-auto">
              {mine.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href ?? "/dashboard/notifications"}
                    onClick={() => {
                      if (actor) void services.notifications.markRead(actor.id, item.id);
                      setOpen(false);
                    }}
                    className={`block px-3 py-2.5 hover:bg-background ${item.read ? "" : "bg-brand-soft/40"}`}
                  >
                    <p className="flex items-start gap-2 text-sm font-semibold text-navy">
                      {!item.read ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" /> : null}
                      {item.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.body}</p>
                    <p className="mt-1 text-[11px] text-muted">{formatRelative(item.createdAt)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="block border-t border-line px-3 py-2.5 text-center text-sm font-semibold text-brand">
            View all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
