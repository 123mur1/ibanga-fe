"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { BrandLink } from "@/components/brand";
import { RequireAuth } from "@/components/require-auth";
import { PayNotice } from "@/components/status-badge";
import { Field, inputClass, PrimaryButton } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import type { Truck } from "@/lib/types";

function BookingForm() {
  const params = useSearchParams();
  const truckId = params.get("truck") ?? "";
  const router = useRouter();
  const { currentUser, createBooking, fetchTruck } = useIbanga();
  const [truck, setTruck] = useState<Truck | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!truckId) return;
    fetchTruck(truckId)
      .then(setTruck)
      .catch(() => setTruck(null));
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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!currentUser || !truck) return;
    const err = createBooking(truck, {
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
  }

  if (!truck) {
    return <p>Select a truck from search first.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-2xl bg-background p-4 text-sm">
        Booking <span className="font-semibold">{truck.plateNumber}</span> ·{" "}
        {truck.truckType} · {truck.preferredRoute}
      </div>
      <PayNotice />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cargo type">
          <input
            className={inputClass}
            required
            value={form.cargoType}
            onChange={(e) => setForm({ ...form, cargoType: e.target.value })}
            placeholder="General cargo"
          />
        </Field>
        <Field label="Cargo weight">
          <input
            className={inputClass}
            required
            value={form.cargoWeight}
            onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })}
            placeholder="16 tons"
          />
        </Field>
      </div>
      <Field label="Cargo description">
        <textarea
          className={`${inputClass} min-h-24`}
          required
          value={form.cargoDescription}
          onChange={(e) =>
            setForm({ ...form, cargoDescription: e.target.value })
          }
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pickup location">
          <input
            className={inputClass}
            required
            value={form.pickupLocation}
            onChange={(e) =>
              setForm({ ...form, pickupLocation: e.target.value })
            }
          />
        </Field>
        <Field label="Destination">
          <input
            className={inputClass}
            required
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
          />
        </Field>
        <Field label="Pickup date">
          <input
            className={inputClass}
            type="date"
            required
            value={form.pickupDate}
            onChange={(e) => setForm({ ...form, pickupDate: e.target.value })}
          />
        </Field>
        <Field label="Expected delivery">
          <input
            className={inputClass}
            type="date"
            required
            value={form.expectedDeliveryDate}
            onChange={(e) =>
              setForm({ ...form, expectedDeliveryDate: e.target.value })
            }
          />
        </Field>
      </div>
      <Field label="Additional instructions">
        <textarea
          className={`${inputClass} min-h-20`}
          value={form.additionalInstructions}
          onChange={(e) =>
            setForm({ ...form, additionalInstructions: e.target.value })
          }
        />
      </Field>
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      <PrimaryButton type="submit">Submit booking request</PrimaryButton>
    </form>
  );
}

export default function NewBookingPage() {
  return (
    <RequireAuth role="IMPORTER">
      <div className="min-h-screen bg-background">
        <header className="border-b border-line bg-card">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
            <BrandLink />
            <Link href="/trucks" className="text-sm font-semibold text-brand">
              Cancel
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">
          <h1 className="font-display text-3xl text-navy">New booking</h1>
          <p className="mt-2 text-sm text-muted">
            Submitting this request makes the truck unavailable immediately.
            You will agree the price next. If the owner rejects, it becomes
            available again.
          </p>
          <div className="mt-6 rounded-3xl border border-line bg-card p-6">
            <Suspense>
              <BookingForm />
            </Suspense>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
