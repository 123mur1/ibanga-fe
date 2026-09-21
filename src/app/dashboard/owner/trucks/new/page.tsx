"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { Field, inputClass, PrimaryButton } from "@/components/ui";
import { PhotoUploader } from "@/components/photos";
import { useIbanga } from "@/lib/store";
import { TRUCK_TYPES } from "@/lib/types";

export default function NewTruckPage() {
  const { addTruck } = useIbanga();
  const router = useRouter();
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const capacity = Number(form.capacity);
    if (!capacity || capacity <= 0) {
      setError("Enter a valid capacity in tons.");
      return;
    }
    setSaving(true);
    setError(null);
    const err = await addTruck({
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
        <h1 className="font-display text-3xl text-navy">Add a truck</h1>
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
              onChange={(e) => setForm({ ...form, truckType: e.target.value })}
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
              placeholder="28"
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
            {saving ? "Saving…" : "Save truck"}
          </PrimaryButton>
        </form>
      </DashboardShell>
    </RequireAuth>
  );
}
