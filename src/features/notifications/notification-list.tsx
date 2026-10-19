"use client";

import Link from "next/link";
import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { controlClass } from "@/components/common/form-fields";
import { GhostButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatRelative } from "@/lib/format";
import { services } from "@/services";
import type { OpsNotification } from "@/types/ops";
import { categoryLabel, NOTIFICATION_CATEGORIES } from "./labels";

export function NotificationList() {
  const actor = useActor();
  const { run, busy } = useAction();
  const [category, setCategory] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const query = useServiceQuery(() => services.notifications.list(actor!.id), [actor?.id]);

  const markRead = (item: OpsNotification) => {
    if (!actor || item.read) return;
    void run(() => services.notifications.markRead(actor.id, item.id), { toastError: false });
  };

  return (
    <QueryBoundary query={query} isEmpty={(items) => items.length === 0} empty={{ title: "No notifications yet", text: "Updates about your bookings, payments, shipments and documents will appear here." }}>
      {(items) => {
        const unread = items.filter((item) => !item.read).length;
        const shown = items.filter((item) => (!category || item.category === category) && (!onlyUnread || !item.read));
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <select className={`${controlClass} max-w-56`} aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">All categories</option>
                {NOTIFICATION_CATEGORIES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm font-medium text-navy">
                <input type="checkbox" className="h-4 w-4 accent-brand" checked={onlyUnread} onChange={(event) => setOnlyUnread(event.target.checked)} />
                Unread only
              </label>
              <span className="text-sm text-muted" aria-live="polite">{unread} unread</span>
              <GhostButton
                type="button"
                className="ml-auto"
                disabled={busy || unread === 0}
                onClick={() => void run(() => services.notifications.markAllRead(actor!.id), { success: "All notifications marked as read." })}
              >
                Mark all as read
              </GhostButton>
            </div>
            {shown.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-card px-5 py-10 text-center text-sm text-muted">No notifications match these filters.</p>
            ) : (
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                {shown.map((item) => (
                  <li key={item.id} className={`flex items-start gap-3 px-5 py-4 ${item.read ? "" : "bg-brand-soft/40"}`}>
                    <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${item.read ? "bg-line" : "bg-brand"}`} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-navy">
                        {item.title}
                        <span className="sr-only">{item.read ? " (read)" : " (unread)"}</span>
                      </p>
                      <p className="mt-0.5 text-sm text-muted">{item.body}</p>
                      <p className="mt-1 text-xs text-muted">{categoryLabel(item.category)} · {formatRelative(item.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-sm font-semibold">
                      {item.href ? (
                        <Link href={item.href} onClick={() => markRead(item)} className="text-brand hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                          Open
                        </Link>
                      ) : null}
                      {!item.read ? (
                        <button type="button" onClick={() => markRead(item)} className="text-xs text-muted hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                          Mark as read
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      }}
    </QueryBoundary>
  );
}
