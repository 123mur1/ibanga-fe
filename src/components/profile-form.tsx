"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { Field, inputClass, PrimaryButton, PageHeader } from "@/components/ui";
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
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
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
        <PageHeader
          eyebrow="Account"
          title="Profile"
          subtitle="Keep your contact details current so owners and importers can reach you."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20a7 7 0 0 1 14 0" />
            </svg>
          }
        />
        <form onSubmit={onSubmit} className="mt-6 max-w-2xl">
          <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
            <div className="flex items-center gap-2.5 border-b border-line bg-background/60 px-6 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <h2 className="font-display text-lg tracking-tight text-navy">
                Personal details
              </h2>
            </div>
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
              <div className="flex shrink-0 flex-col items-center gap-3">
                <div className="relative">
                  <Avatar src={currentUser?.photo} name={form.name || "You"} size="lg" />
                  {photoBusy ? (
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-navy/40">
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </span>
                  ) : null}
                </div>
                <Field label="Profile photo">
                  <input
                    className="max-w-44 cursor-pointer rounded-xl border border-line bg-white px-3 py-2 text-xs text-muted shadow-soft file:mr-2 file:rounded-lg file:border-0 file:bg-brand-soft file:px-2 file:py-1 file:text-xs file:font-semibold file:text-brand-dark disabled:opacity-50"
                    type="file"
                    accept="image/*"
                    disabled={photoBusy}
                    onChange={async (e) => {
                      const input = e.target;
                      const file = input.files?.[0];
                      if (!file) return;
                      input.value = "";
                      setPhotoBusy(true);
                      setPhotoError(null);
                      try {
                        const photo = await readImageFile(file);
                        const error = await updateProfile({ photo });
                        if (error) setPhotoError(error);
                        else setSaved(true);
                      } catch (err) {
                        setPhotoError(
                          err instanceof Error ? err.message : "Could not upload this image.",
                        );
                      } finally {
                        setPhotoBusy(false);
                      }
                    }}
                  />
                </Field>
                {photoError ? (
                  <p className="max-w-44 text-center text-xs font-medium text-bad">
                    {photoError}
                  </p>
                ) : null}
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
                <p className="inline-flex items-center gap-1.5 text-xs text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {currentUser?.email}
                </p>
                <div className="flex items-center gap-3 border-t border-line pt-4">
                  <PrimaryButton type="submit">Save profile</PrimaryButton>
                  {saved ? (
                    <p className="inline-flex items-center gap-1.5 text-sm font-medium text-good">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      Saved.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
          <p className="mt-3 text-xs text-muted">
            Images are resized before they are saved to your profile.
          </p>
        </form>
      </DashboardShell>
    </RequireAuth>
  );
}
