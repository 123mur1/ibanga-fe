"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { OptionSelect } from "@/components/common/form-fields";
import { PhotoUploader } from "@/components/photos";
import { Field, inputClass, PrimaryButton } from "@/components/ui";
import type { NewTruckInput } from "@/lib/store";
import { CARGO_TYPES, LOCATIONS, TRUCK_TYPES, VEHICLE_CATEGORIES, type Truck } from "@/lib/types";

export type TruckFormValues = Required<NewTruckInput>;

function Section({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
      <div className="border-b border-line bg-background/60 px-5 py-3.5">
        <h2 className="font-display text-lg tracking-tight text-navy">{title}</h2>
        {text ? <p className="mt-0.5 text-sm text-muted">{text}</p> : null}
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

/** Toggle chips for choosing several values from a fixed list. */
function ChipPicker({ label, options, selected, onChange, disabled = [] }: { label: string; options: readonly string[]; selected: string[]; onChange: (next: string[]) => void; disabled?: string[] }) {
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const on = selected.includes(option);
          const off = disabled.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              disabled={off}
              onClick={() => onChange(on ? selected.filter((item) => item !== option) : [...selected, option])}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                on
                  ? "bg-brand text-white shadow-soft"
                  : off
                    ? "cursor-not-allowed bg-background text-muted/50 ring-1 ring-line"
                    : "bg-white text-navy ring-1 ring-line hover:ring-brand/40"
              }`}
            >
              {on ? "✓ " : ""}{option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** The owner's form for listing or editing a vehicle, priced per kilometre. */
export function TruckForm({
  initial,
  submitLabel,
  footerNote,
  onSubmit,
}: {
  initial?: Truck;
  submitLabel: string;
  footerNote: string;
  onSubmit: (values: TruckFormValues) => Promise<string | null>;
}) {
  const [form, setForm] = useState({
    plateNumber: initial?.plateNumber ?? "",
    category: initial?.category ?? "",
    truckType: initial?.truckType ?? "Container",
    capacity: initial ? String(initial.capacity) : "",
    pricePerKmRwf: initial?.pricePerKmRwf == null ? "" : String(initial.pricePerKmRwf),
    currentLocation: initial?.currentLocation ?? "",
    description: initial?.description ?? "",
  });
  const [destinations, setDestinations] = useState<string[]>(initial?.destinations ?? []);
  const [acceptedCargo, setAcceptedCargo] = useState<string[]>(initial?.acceptedCargo ?? []);
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const capacity = Number(form.capacity);
    const pricePerKmRwf = Number(form.pricePerKmRwf);
    const places = destinations.filter((place) => place !== form.currentLocation);
    if (!form.category) return setError("Choose the vehicle category.");
    if (!capacity || capacity <= 0) return setError("Enter a valid capacity in tons.");
    if (!Number.isInteger(pricePerKmRwf) || pricePerKmRwf < 1) return setError("Enter a whole-number price per kilometre in RWF.");
    if (!form.currentLocation) return setError("Choose where the vehicle is now.");
    if (!places.length) return setError("Choose at least one destination you deliver to.");
    if (!acceptedCargo.length) return setError("Choose at least one kind of cargo the vehicle carries.");
    setSaving(true);
    setError(null);
    const failure = await onSubmit({
      plateNumber: form.plateNumber.trim(),
      category: form.category,
      truckType: form.truckType,
      capacity,
      pricePerKmRwf,
      currentLocation: form.currentLocation,
      destinations: places,
      acceptedCargo,
      // Older screens and reports still read a single route line.
      preferredRoute: `${form.currentLocation} — ${places.join(", ")}`.slice(0, 120),
      description: form.description,
      photos,
    });
    setSaving(false);
    if (failure) setError(failure);
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-3xl space-y-4">
      <Section title="Vehicle">
        <Field label="Plate number">
          <input className={inputClass} required placeholder="RAD 452 C" value={form.plateNumber} onChange={(e) => set({ plateNumber: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category">
            <OptionSelect className={inputClass} required options={VEHICLE_CATEGORIES} placeholder="Choose a category" value={form.category} onChange={(e) => set({ category: e.target.value })} />
          </Field>
          <Field label="Body type">
            <select className={inputClass} value={form.truckType} onChange={(e) => set({ truckType: e.target.value })}>
              {TRUCK_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </Field>
          <Field label="Capacity (tons)">
            <input className={inputClass} type="number" min="0.1" step="0.1" required value={form.capacity} onChange={(e) => set({ capacity: e.target.value })} placeholder="28" />
          </Field>
        </div>
        <Field label="Description">
          <textarea className={`${inputClass} min-h-24`} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Condition, equipment, driver experience: anything the importer should know." />
        </Field>
        <Field label="Photos (optional)">
          <PhotoUploader photos={photos} onChange={setPhotos} />
        </Field>
      </Section>

      <Section title="Price and route" text="Importers pay the road distance from the vehicle's location to their destination, times your rate.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price per kilometre (RWF)">
            <div className="relative">
              <input className={`${inputClass} pr-14`} type="number" min="1" max="1000000" step="1" required value={form.pricePerKmRwf} onChange={(e) => set({ pricePerKmRwf: e.target.value })} placeholder="1500" />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">/ km</span>
            </div>
            {Number(form.pricePerKmRwf) > 0 ? (
              <span className="mt-1.5 block text-xs text-muted">A 100 km trip costs RWF {(Number(form.pricePerKmRwf) * 100).toLocaleString("en-RW")}.</span>
            ) : null}
          </Field>
          <Field label="Where the vehicle is now">
            <OptionSelect className={inputClass} required options={LOCATIONS} placeholder="Choose a location" value={form.currentLocation} onChange={(e) => set({ currentLocation: e.target.value })} />
          </Field>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-navy">Destinations you deliver to <span className="font-normal text-muted">({destinations.filter((place) => place !== form.currentLocation).length} chosen)</span></p>
          <ChipPicker label="Destinations" options={LOCATIONS} selected={destinations} onChange={setDestinations} disabled={form.currentLocation ? [form.currentLocation] : []} />
          <p className="mt-2 text-xs text-muted">Importers can only choose from these places.</p>
        </div>
      </Section>

      <Section title="Cargo" text="What the vehicle is suited to carry. Importers filter by this.">
        <ChipPicker label="Cargo the vehicle carries" options={CARGO_TYPES} selected={acceptedCargo} onChange={setAcceptedCargo} />
      </Section>

      {error ? (
        <p role="alert" className="rounded-xl border border-bad/20 bg-bad-soft px-3.5 py-2.5 text-sm text-bad">{error}</p>
      ) : null}

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-card/95 px-5 py-3.5 shadow-card backdrop-blur">
        <p className="hidden text-sm text-muted sm:block">{footerNote}</p>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/owner/trucks" className="text-sm font-semibold text-muted transition hover:text-navy">Cancel</Link>
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving…
              </>
            ) : submitLabel}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}
