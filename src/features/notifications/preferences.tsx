"use client";

import { QueryBoundary } from "@/components/common/async-state";
import { Notice } from "@/components/common/notices";
import { Section } from "@/components/common/layout-blocks";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { services } from "@/services";
import type { NotificationCategory, NotificationChannelPrefs } from "@/types/ops";
import { NOTIFICATION_CATEGORIES } from "./labels";

const CHANNELS: { key: keyof NotificationChannelPrefs; label: string }[] = [
  { key: "inApp", label: "In-app" },
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
  { key: "push", label: "Push" },
];

export function NotificationPreferences() {
  const actor = useActor();
  const { run, busy } = useAction();
  const query = useServiceQuery(() => services.notifications.getPreferences(actor!.id), [actor?.id]);

  function toggle(category: NotificationCategory, current: NotificationChannelPrefs, channel: keyof NotificationChannelPrefs) {
    if (!actor) return;
    void run(() => services.notifications.setPreference(actor.id, category, { ...current, [channel]: !current[channel] }), { success: "Preference saved." });
  }

  return (
    <div className="space-y-4">
      <Notice tone="warning" title="Email, SMS and push are not connected yet">
        In-app notifications are delivered here.
      </Notice>
      <QueryBoundary query={query}>
        {(prefs) => (
          <Section title="Channels by category" description="Choose how you want to hear about each kind of update." padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th scope="col" className="px-5 py-3 font-medium">Category</th>
                    {CHANNELS.map((channel) => <th key={channel.key} scope="col" className="px-3 py-3 text-center font-medium">{channel.label}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {NOTIFICATION_CATEGORIES.map(({ key, label }) => {
                    const current = prefs[key];
                    return (
                      <tr key={key}>
                        <th scope="row" className="px-5 py-3 font-semibold text-navy">{label}</th>
                        {CHANNELS.map((channel) => (
                          <td key={channel.key} className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-brand"
                              checked={current[channel.key]}
                              disabled={busy}
                              onChange={() => toggle(key, current, channel.key)}
                              aria-label={`${label} by ${channel.label}`}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        )}
      </QueryBoundary>
    </div>
  );
}
