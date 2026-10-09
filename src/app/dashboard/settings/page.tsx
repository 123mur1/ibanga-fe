"use client";

import { useState, useSyncExternalStore } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { PageHeader, StatCard } from "@/components/ui";
import { useIbanga } from "@/lib/store";

const SETTINGS_STORAGE_KEY = "ibanga-settings";
const DEFAULT_PREFERENCES = "email=true&trips=true";

function subscribeToPreferences(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("ibanga-settings-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("ibanga-settings-change", onChange);
  };
}

function getStoredPreferences() {
  return localStorage.getItem(SETTINGS_STORAGE_KEY) ?? DEFAULT_PREFERENCES;
}

export default function SettingsPage() {
  const { currentUser } = useIbanga();
  const [saved, setSaved] = useState(false);
  const preferenceValue = useSyncExternalStore(subscribeToPreferences, getStoredPreferences, () => DEFAULT_PREFERENCES);
  const preferences = new URLSearchParams(preferenceValue);
  const emailUpdates = preferences.get("email") !== "false";
  const tripAlerts = preferences.get("trips") !== "false";

  function updatePreference(name: "email" | "trips", value: boolean) {
    preferences.set(name, String(value));
    localStorage.setItem(SETTINGS_STORAGE_KEY, preferences.toString());
    window.dispatchEvent(new Event("ibanga-settings-change"));
    setSaved(false);
  }

  return (
    <RequireAuth>
      <DashboardShell role={currentUser?.role ?? "IMPORTER"}>
        <PageHeader
          eyebrow="Workspace"
          title="Settings"
          subtitle="Manage your workspace preferences. Changes are saved on this device."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Account role" value={currentUser?.role.replace("_", " ") ?? "—"} hint="Controls dashboard access" />
          <StatCard label="Workspace" value="iBanga" hint="Freight marketplace" accent="accent" />
          <StatCard label="Data mode" value="On this device" hint="Browser storage" accent="good" />
        </div>
        <section className="mt-6 max-w-3xl rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-7">
          <h2 className="font-display text-xl text-navy">Notifications</h2>
          <p className="mt-1 text-sm text-muted">Choose which account updates you want to see.</p>
          <div className="mt-5 divide-y divide-line">
            <label className="flex cursor-pointer items-center justify-between gap-4 py-4">
              <span><span className="block text-sm font-semibold text-navy">Email updates</span><span className="text-xs text-muted">Booking and account summaries</span></span>
              <input type="checkbox" checked={emailUpdates} onChange={(event) => updatePreference("email", event.target.checked)} className="h-4 w-4 accent-brand" />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-4 py-4">
              <span><span className="block text-sm font-semibold text-navy">Trip alerts</span><span className="text-xs text-muted">Status changes and delivery reminders</span></span>
              <input type="checkbox" checked={tripAlerts} onChange={(event) => updatePreference("trips", event.target.checked)} className="h-4 w-4 accent-brand" />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => {
              localStorage.setItem(SETTINGS_STORAGE_KEY, preferenceValue);
              setSaved(true);
            }} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark">Save preferences</button>
            {saved ? <span role="status" className="text-sm font-medium text-good">Preferences saved for this session.</span> : null}
          </div>
        </section>
      </DashboardShell>
    </RequireAuth>
  );
}
