"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { Field, inputClass, PrimaryButton } from "@/components/ui";
import { PhotoUploader } from "@/components/photos";
import { useIbanga } from "@/lib/store";
import { TRUCK_TYPES, type Truck } from "@/lib/types";

export default function EditTruckPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser, fetchTruck, updateTruck } = useIbanga();
  const [truck, setTruck] = useState<Truck | null | undefined>(undefined);
  const [form, setForm] = useState({
    plateNumber: "",
    truckType: "Container",
    capacity: "",
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
    if (!capacity || capacity <= 0) {
      setError("Enter a valid capacity in tons.");
      return;
    }
    setSaving(true);
    setError(null);
    const err = await updateTruck(id, {
      plateNumber: form.plateNumber,
      truckType: form.truckType,
      capacity,
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
        <h1 className="font-display text-3xl text-navy">Edit truck</h1>
        {truck === undefined ? (
          <p className="mt-4 text-muted">Loading…</p>
        ) : !truck ? (
          <p className="mt-4">Truck not found.</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 max-w-xl space-y-4">
            <Field label="Plate number">
              <input
                className={inputClass}
                required
                value={form.plateNumber}
                onChange={(e) =>
                  setForm({ ...form, plateNumber: e.target.value })
                }
              />
            </Field>
            <Field label="Truck type">
              <select
                className={inputClass}
                value={form.truckType}
                onChange={(e) =>
                  setForm({ ...form, truckType: e.target.value })
                }
              >
                {TRUCK_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Capacity (tons)">
              <input
                className={inputClass}
                type="number"
                min="0.1"
                step="0.1"
                required
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </Field>
            <Field label="Current location">
              <input
                className={inputClass}
                required
                value={form.currentLocation}
                onChange={(e) =>
                  setForm({ ...form, currentLocation: e.target.value })
                }
              />
            </Field>
            <Field label="Preferred route / region">
              <input
                className={inputClass}
                required
                value={form.preferredRoute}
                onChange={(e) =>
                  setForm({ ...form, preferredRoute: e.target.value })
                }
              />
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
            {error ? <p className="text-sm text-bad">{error}</p> : null}
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Saving…" : "Update truck"}
            </PrimaryButton>
          </form>
        )}
      </DashboardShell>
    </RequireAuth>
  );
}
