"use client";

import { useState, useSyncExternalStore } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import Link from "next/link";
import { ConfirmButton } from "@/components/common/confirm-button";
import { Notice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { PageHeader, StatCard } from "@/components/ui";
import { useToast } from "@/components/toast";
import { services } from "@/services";
import { errorMessage } from "@/services/types";
import { useIbanga } from "@/lib/store";

const SETTINGS_STORAGE_KEY = "ibanga-settings";
const MARKETPLACE_DEMO_KEY = "ibanga-demo-session-v1";
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
  const toast = useToast();
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
        <section className="mt-6 max-w-3xl rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-7">
          <h2 className="font-display text-xl text-navy">Account</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm font-medium text-muted">Name</dt><dd className="font-semibold text-navy">{currentUser?.name ?? "—"}</dd></div>
            <div><dt className="text-sm font-medium text-muted">Email</dt><dd className="break-words font-semibold text-navy">{currentUser?.email ?? "—"}</dd></div>
            <div><dt className="text-sm font-medium text-muted">Role</dt><dd className="font-semibold text-navy">{currentUser?.role.replaceAll("_", " ") ?? "—"}</dd></div>
            <div><dt className="text-sm font-medium text-muted">Account status</dt><dd className="mt-0.5">{currentUser ? <StatusBadge family="account" status={currentUser.active ? "ACTIVE" : "INACTIVE"} /> : "—"}</dd></div>
          </dl>
          <p className="mt-5 text-sm text-muted">
            Choose which kinds of update reach you, and on which channel, in{" "}
            <Link href="/dashboard/notifications?tab=preferences" className="font-semibold text-brand hover:text-brand-dark">notification preferences</Link>.
          </p>
        </section>
        <section className="mt-6 max-w-3xl space-y-4 rounded-2xl border border-bad/25 bg-white p-5 shadow-soft sm:p-7">
          <h2 className="font-display text-xl text-navy">Demonstration data</h2>
          <Notice tone="warning" title="Demonstration only">
            All bookings, payments, shipments, documents and messages in this build are sample data stored in this browser. Resetting restores the original samples and signs you out of any changes you made.
          </Notice>
          <ConfirmButton
            variant="ghost"
            tone="danger"
            label="Reset demonstration data"
            title="Reset all demonstration data?"
            message="This cannot be undone."
            summary={[
              "Bookings, payments, shipments, documents, disputes, tickets and notifications return to the original samples.",
              "Anything you created in this browser is deleted.",
              "The page reloads afterwards.",
            ]}
            confirmLabel="Reset and reload"
            onConfirm={async () => {
              try {
                await services.admin.resetDemoData();
              } catch (error) {
                toast(errorMessage(error), "bad");
                return;
              }
              try {
                localStorage.removeItem(MARKETPLACE_DEMO_KEY);
              } catch {
                /* storage unavailable */
              }
              window.location.reload();
            }}
          />
        </section>
      </DashboardShell>
    </RequireAuth>
  );
}
