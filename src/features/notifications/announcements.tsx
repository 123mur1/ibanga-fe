"use client";

import { Notice } from "@/components/common/notices";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate } from "@/lib/format";
import { services } from "@/services";

const TONE = { INFO: "info", WARNING: "warning", CRITICAL: "danger" } as const;

/** Announcements published by administrators for the signed-in user's role. */
export function Announcements() {
  const actor = useActor();
  const query = useServiceQuery(() => services.notifications.listAnnouncements(actor!), [actor?.id, actor?.role]);
  if (!query.data?.length) return null;
  return (
    <section aria-label="Announcements" className="mt-6 space-y-3">
      {query.data.map((item) => (
        <Notice key={item.id} tone={TONE[item.severity]} title={`${item.title} · ${formatDate(item.publishedAt)}`}>
          {item.body}
        </Notice>
      ))}
    </section>
  );
}
