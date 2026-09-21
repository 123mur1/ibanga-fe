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
    setForm({
      name: currentUser.name,
      phone: currentUser.phone,
      location: currentUser.location,
      company: currentUser.company ?? "",
    });
  }, [currentUser]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    updateProfile(form);
    setSaved(true);
  }

  return (
    <RequireAuth role={role}>
      <DashboardShell role={role}>
        <h1 className="font-display text-3xl text-navy">Profile</h1>
        <form onSubmit={onSubmit} className="mt-6 max-w-lg space-y-4">
          <div className="flex items-center gap-4">
            <Avatar src={currentUser?.photo} name={form.name || "You"} size="lg" />
            <Field label="Profile photo">
              <input
                className="text-sm"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const photo = await readImageFile(file);
                  updateProfile({ photo });
                  setSaved(true);
                }}
              />
              <p className="mt-1 text-xs text-muted">
                Stored in this browser for the demo. Backend upload comes later.
              </p>
            </Field>
          </div>
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
          <p className="text-sm text-muted">{currentUser?.email}</p>
          <PrimaryButton type="submit">Save profile</PrimaryButton>
          {saved ? <p className="text-sm text-good">Saved.</p> : null}
        </form>
      </DashboardShell>
    </RequireAuth>
  );
}
