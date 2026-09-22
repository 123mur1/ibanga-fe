"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { Field, inputClass, PrimaryButton } from "@/components/ui";
import { Avatar, readImageFile } from "@/components/photos";
import { useIbanga } from "@/lib/store";
import { FormEvent, useEffect, useState } from "react";

export default function ProfilePage({
  role,
}: {
  role: "IMPORTER" | "TRUCK_OWNER";
}) {
  const { currentUser, updateProfile } = useIbanga();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    location: "",
    company: "",
  });

  useEffect(() => {
    if (!currentUser) return;
    const timer = window.setTimeout(() => {
      setForm({
        name: currentUser.name,
        phone: currentUser.phone,
        location: currentUser.location,
        company: currentUser.company ?? "",
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [currentUser]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const error = await updateProfile(form);
    setSaved(!error);
  }

  return (
    <RequireAuth role={role}>
      <DashboardShell role={role}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight text-navy">
              Profile
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              Keep your contact details current so owners and importers can
              reach you.
            </p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="mt-6 max-w-2xl">
          <div className="rounded-2xl border border-line bg-card p-6 shadow-soft">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex shrink-0 flex-col items-center gap-3">
                <Avatar src={currentUser?.photo} name={form.name || "You"} size="lg" />
                <Field label="Profile photo">
                  <input
                    className="max-w-44 cursor-pointer rounded-xl border border-line bg-white px-3 py-2 text-xs text-muted shadow-soft file:mr-2 file:rounded-lg file:border-0 file:bg-brand-soft file:px-2 file:py-1 file:text-xs file:font-semibold file:text-brand-dark"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const photo = await readImageFile(file);
                      const error = await updateProfile({ photo });
                      setSaved(!error);
                    }}
                  />
                </Field>
              </div>
              <div className="flex-1 space-y-4">
                <Field label="Name">
                  <input
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    className={inputClass}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </Field>
                <Field label="Location">
                  <input
                    className={inputClass}
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </Field>
                <Field label="Company">
                  <input
                    className={inputClass}
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </Field>
                <p className="text-xs text-muted">{currentUser?.email}</p>
                <div className="flex items-center gap-3">
                  <PrimaryButton type="submit">Save profile</PrimaryButton>
                  {saved ? (
                    <p className="text-sm font-medium text-good">Saved.</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">
            Images are resized before they are saved to your profile.
          </p>
        </form>
      </DashboardShell>
    </RequireAuth>
  );
}
