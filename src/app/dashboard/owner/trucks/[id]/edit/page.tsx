"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { Field, inputClass, PrimaryButton } from "@/components/ui";
import { PhotoUploader } from "@/components/photos";
import { useIbanga } from "@/lib/store";
import { TRUCK_TYPES, type Truck } from "@/lib/types";

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
      {children}
    </span>
  );
}

export default function EditTruckPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser, fetchTruck, updateTruck } = useIbanga();
  const [truck, setTruck] = useState<Truck | null | undefined>(undefined);
  const [form, setForm] = useState({
    plateNumber: "",
    truckType: "Container",
    capacity: "",
    priceRwf: "",
    currentLocation: "",
    preferredRoute: "",
    description: "",
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTruck(id)
      .then((t) => {
        if (t.ownerId !== currentUser?.id) {
          setTruck(null);
          return;
        }
        setTruck(t);
        setForm({
          plateNumber: t.plateNumber,
          truckType: t.truckType,
          capacity: String(t.capacity),
          priceRwf: t.priceRwf == null ? "" : String(t.priceRwf),
          currentLocation: t.currentLocation,
          preferredRoute: t.preferredRoute,
          description: t.description,
        });
        setPhotos(t.photos ?? []);
      })
      .catch(() => setTruck(null));
  }, [id, currentUser?.id, fetchTruck]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const capacity = Number(form.capacity);
    const priceRwf = Number(form.priceRwf);
    if (!capacity || capacity <= 0) {
      setError("Enter a valid capacity in tons.");
      return;
    }
    if (!Number.isInteger(priceRwf) || priceRwf < 1) {
      setError("Enter a whole-number asking price in RWF.");
      return;
    }
    setSaving(true);
    setError(null);
    const err = await updateTruck(id, {
      plateNumber: form.plateNumber,
      truckType: form.truckType,
      capacity,
      priceRwf,
      currentLocation: form.currentLocation,
      preferredRoute: form.preferredRoute,
      description: form.description,
      photos,
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    router.push("/dashboard/owner/trucks");
  }

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        <div>
          <Link
            href="/dashboard/owner/trucks"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 4-8 8 8 8" />
            </svg>
            My trucks
          </Link>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-navy">
            Edit truck
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Keep the truck details current so importers know what to expect.
          </p>
        </div>

        {truck === undefined ? (
          <p className="mt-6 text-muted">Loading…</p>
        ) : !truck ? (
          <p className="mt-6 rounded-2xl border border-line bg-card px-5 py-8 text-center text-muted shadow-soft">
            Truck not found.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 max-w-xl">
            <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
              <div className="flex items-center gap-2.5 border-b border-line bg-background/60 px-5 py-3.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
                    <circle cx="7.5" cy="17.5" r="1.8" />
                    <circle cx="17.5" cy="17.5" r="1.8" />
                  </svg>
                </span>
                <h2 className="font-display text-lg tracking-tight text-navy">
                  Truck details
                </h2>
              </div>
              <div className="space-y-4 p-5">
                <Field label="Plate number">
                  <div className="relative">
                    <FieldIcon>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="5" width="18" height="12" rx="2" />
                        <path d="M3 10h18M7 15h4" />
                      </svg>
                    </FieldIcon>
                    <input
                      className={`${inputClass} pl-11`}
                      required
                      value={form.plateNumber}
                      onChange={(e) =>
                        setForm({ ...form, plateNumber: e.target.value })
                      }
                    />
                  </div>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Truck type">
                    <div className="relative">
                      <FieldIcon>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
                          <circle cx="7.5" cy="17.5" r="1.8" />
                          <circle cx="17.5" cy="17.5" r="1.8" />
                        </svg>
                      </FieldIcon>
                      <select
                        className={`${inputClass} pl-11`}
                        value={form.truckType}
                        onChange={(e) =>
                          setForm({ ...form, truckType: e.target.value })
                        }
                      >
                        {TRUCK_TYPES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </Field>
                  <Field label="Capacity (tons)">
                    <div className="relative">
                      <FieldIcon>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="4" width="18" height="16" rx="2" />
                          <path d="M3 9h18M8 4v5m8-5v5" />
                        </svg>
                      </FieldIcon>
                      <input
                        className={`${inputClass} pl-11`}
                        type="number"
                        min="0.1"
                        step="0.1"
                        required
                        value={form.capacity}
                        onChange={(e) =>
                          setForm({ ...form, capacity: e.target.value })
                        }
                      />
                    </div>
                  </Field>
                </div>
                <Field label="Price per booking (RWF)">
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    max="1000000000"
                    step="1"
                    required
                    value={form.priceRwf}
                    onChange={(e) => setForm({ ...form, priceRwf: e.target.value })}
                    placeholder="850000"
                  />
                </Field>
                <Field label="Current location">
                  <div className="relative">
                    <FieldIcon>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </FieldIcon>
                    <input
                      className={`${inputClass} pl-11`}
                      required
                      value={form.currentLocation}
                      onChange={(e) =>
                        setForm({ ...form, currentLocation: e.target.value })
                      }
                    />
                  </div>
                </Field>
                <Field label="Preferred route / region">
                  <div className="relative">
                    <FieldIcon>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="6" cy="19" r="2.5" />
                        <circle cx="18" cy="5" r="2.5" />
                        <path d="M8.5 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
                      </svg>
                    </FieldIcon>
                    <input
                      className={`${inputClass} pl-11`}
                      required
                      value={form.preferredRoute}
                      onChange={(e) =>
                        setForm({ ...form, preferredRoute: e.target.value })
                      }
                    />
                  </div>
                </Field>
                <Field label="Description">
                  <textarea
                    className={`${inputClass} min-h-24`}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </Field>
                <Field label="Photos (optional)">
                  <PhotoUploader photos={photos} onChange={setPhotos} />
                </Field>
                {error ? (
                  <p className="flex items-center gap-2 rounded-xl border border-bad/20 bg-bad-soft px-3.5 py-2.5 text-sm text-bad">
                    {error}
                  </p>
                ) : null}
              </div>
            </section>

            <div className="sticky bottom-4 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-card/95 px-5 py-3.5 shadow-card backdrop-blur">
              <p className="hidden text-sm text-muted sm:block">
                Changes apply to importer search immediately.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/owner/trucks"
                  className="text-sm font-semibold text-muted transition hover:text-navy"
                >
                  Cancel
                </Link>
                <PrimaryButton type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving…
                    </>
                  ) : (
                    <>
                      Update truck
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </>
                  )}
                </PrimaryButton>
              </div>
            </div>
          </form>
        )}
      </DashboardShell>
    </RequireAuth>
  );
}