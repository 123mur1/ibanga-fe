"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { BrandLink } from "@/components/brand";
import { RequireAuth } from "@/components/require-auth";
import { TruckThumb } from "@/components/photos";
import { Field, inputClass, PrimaryButton } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import type { Truck } from "@/lib/types";

function BookingForm() {
  const params = useSearchParams();
  const truckId = params.get("truck") ?? "";
  const router = useRouter();
  const { currentUser, createBooking, fetchTruck } = useIbanga();
  const [truck, setTruck] = useState<Truck | null>(null);
  const [loadedTruckId, setLoadedTruckId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!truckId) return;
    fetchTruck(truckId)
      .then((selectedTruck) => {
        setTruck(selectedTruck);
        setLoadedTruckId(truckId);
      })
      .catch(() => {
        setTruck(null);
        setLoadedTruckId(truckId);
      });
  }, [truckId, fetchTruck]);
  const [form, setForm] = useState({
    cargoType: "",
    cargoDescription: "",
    cargoWeight: "",
    pickupLocation: "",
    destination: "",
    pickupDate: "",
    expectedDeliveryDate: "",
    additionalInstructions: "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!currentUser || !truck || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const err = await createBooking(truck, {
        ...form,
        truckId: truck.id,
        importerId: currentUser.id,
        agreedPrice: "",
      });
      if (err) {
        setError(err);
        return;
      }
      router.push("/dashboard/importer/bookings");
    } finally {
      setSubmitting(false);
    }
  }

  if (truckId && loadedTruckId !== truckId) {
    return <p className="py-8 text-center text-sm text-muted">Loading truck details…</p>;
  }

  if (!truck) {
    return (
      <div className="rounded-xl border border-line bg-background p-5 text-center">
        <p className="font-semibold text-navy">Choose a truck to continue</p>
        <p className="mt-1 text-sm text-muted">Select an available truck before starting a booking.</p>
        <Link href="/trucks" className="mt-4 inline-flex text-sm font-semibold text-brand hover:text-brand-dark">
          Browse available trucks
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-line bg-white p-3 sm:gap-4 sm:p-4">
        <TruckThumb photos={truck.photos} alt={truck.plateNumber} className="aspect-square w-20 shrink-0 sm:w-24" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Booking with</p>
          <h2 className="mt-1 truncate font-display text-lg text-navy sm:text-xl">{truck.truckType}</h2>
          <p className="mt-0.5 truncate text-sm text-muted">{truck.plateNumber} <span aria-hidden="true">·</span> {truck.currentLocation || "Location not specified"}</p>
        </div>
        <div className="hidden shrink-0 border-l border-line pl-5 text-right sm:block">
          <p className="text-xs text-muted">Maximum load</p>
          <p className="mt-1 font-display text-xl text-navy">{truck.capacity}<span className="ml-1 text-sm font-sans text-muted">tons</span></p>
        </div>
        <Link href={`/trucks/${truck.id}`} className="shrink-0 self-start rounded-lg p-2 text-muted transition hover:bg-background hover:text-brand" aria-label="View truck details" title="View truck details">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 17 17 7M7 7h10v10" />
          </svg>
        </Link>
      </div>

      <section aria-labelledby="cargo-heading" className="border-b border-line pb-8">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">1</span>
          <div>
            <h2 id="cargo-heading" className="font-display text-xl text-navy">Your cargo</h2>
            <p className="mt-1 text-sm text-muted">What are you shipping?</p>
          </div>
        </div>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Field label="Cargo type">
            <input className={inputClass} required value={form.cargoType} onChange={(e) => setForm({ ...form, cargoType: e.target.value })} placeholder="e.g. Coffee beans" />
          </Field>
          <Field label="Weight">
            <div className="relative">
              <input className={`${inputClass} pr-16`} type="number" min="0.1" max={truck.capacity} step="0.1" required value={form.cargoWeight} onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })} placeholder="0.0" />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">tons</span>
            </div>
            <span className="mt-1.5 block text-xs text-muted">Truck limit: {truck.capacity} tons</span>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Cargo description">
              <textarea className={`${inputClass} min-h-24 resize-y`} required value={form.cargoDescription} onChange={(e) => setForm({ ...form, cargoDescription: e.target.value })} placeholder="Describe the goods, packaging, or any special handling needs." />
            </Field>
          </div>
        </div>
      </section>

      <section aria-labelledby="journey-heading" className="pt-8">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">2</span>
          <div>
            <h2 id="journey-heading" className="font-display text-xl text-navy">The journey</h2>
            <p className="mt-1 text-sm text-muted">Where and when should the truck travel?</p>
          </div>
        </div>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Field label="Pickup location">
            <input className={inputClass} required value={form.pickupLocation} onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })} placeholder="City or address" />
          </Field>
          <Field label="Destination">
            <input className={inputClass} required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="City or address" />
          </Field>
          <Field label="Pickup date">
            <input className={inputClass} type="date" required value={form.pickupDate} onChange={(e) => setForm({ ...form, pickupDate: e.target.value })} />
          </Field>
          <Field label="Expected delivery date">
            <input className={inputClass} type="date" required value={form.expectedDeliveryDate} onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Instructions for the driver (optional)">
              <textarea className={`${inputClass} min-h-20 resize-y`} value={form.additionalInstructions} onChange={(e) => setForm({ ...form, additionalInstructions: e.target.value })} placeholder="Access notes, contact person, or delivery instructions." />
            </Field>
          </div>
        </div>
      </section>

      <div className="mt-8 border-t border-line pt-5">
        <div className="mb-5 flex items-start gap-2.5 text-sm leading-5 text-muted">
          <svg className="mt-0.5 shrink-0 text-accent-dark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" />
          </svg>
          <p>Submitting holds this truck at its listed RWF price while the owner reviews your request. After acceptance, pay from your iBanga wallet before the trip starts.</p>
        </div>
        {error ? <p role="alert" className="mb-4 rounded-lg border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">{error}</p> : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/trucks" className="rounded-lg px-4 py-3 text-center text-sm font-semibold text-muted transition hover:bg-background hover:text-navy">Back to trucks</Link>
          <PrimaryButton className="w-full py-3 sm:w-auto sm:min-w-56" type="submit" disabled={submitting}>
            {submitting ? "Submitting request…" : "Send booking request"}
            {!submitting ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg> : null}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}

export default function NewBookingPage() {
  return (
    <RequireAuth role="IMPORTER">
      <div className="min-h-screen bg-background">
        <header className="border-b border-line bg-card">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <BrandLink />
            <Link href="/trucks" className="text-sm font-semibold text-brand">
              Cancel
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <div className="mx-auto mb-7 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Booking request</p>
            <h1 className="mt-2 font-display text-3xl text-navy sm:text-4xl">Tell us about your shipment</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
              Add your cargo and route details. The owner will review your request and confirm the trip.
            </p>
          </div>
          <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-white px-5 py-6 shadow-soft sm:px-8 sm:py-8">
            <Suspense>
              <BookingForm />
            </Suspense>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
