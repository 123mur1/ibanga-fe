"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { TruckThumb } from "@/components/photos";
import { useToast } from "@/components/toast";
import { Field, inputClass, PrimaryButton } from "@/components/ui";
import { formatRwf, maskAccount } from "@/lib/payments";
import { useIbanga } from "@/lib/store";
import type { PaymentMethod, Truck } from "@/lib/types";

function BookingForm() {
  const params = useSearchParams();
  const truckId = params.get("truck") ?? "";
  const router = useRouter();
  const { currentUser, createBooking, fetchTruck } = useIbanga();
  const toast = useToast();
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
  const [method, setMethod] = useState<PaymentMethod>("VISA");
  const [payerName, setPayerName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [phone, setPhone] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!currentUser || !truck || submitting) return;
    const amount = truck.priceRwf ?? 0;
    if (amount < 1000) {
      setError("This truck does not have a price yet.");
      return;
    }
    if (method === "VISA" && (cardNumber.replace(/\D/g, "").length < 13 || expiry.length < 4 || cvv.length < 3)) {
      setError("Enter the Visa card number, expiry, and security code.");
      return;
    }
    if (method !== "VISA" && phone.replace(/\D/g, "").length < 9) {
      setError("Enter the mobile money number for this payment.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const paidAt = new Date();
    try {
      const err = await createBooking(truck, {
        ...form,
        truckId: truck.id,
        importerId: currentUser.id,
        agreedPrice: formatRwf(amount),
      }, {
        method,
        payerName,
        accountMask: maskAccount(method, method === "VISA" ? cardNumber : phone),
      });
      if (err) {
        setError(err);
        toast(err, "bad");
        return;
      }
      toast(`Payment recorded ${paidAt.toLocaleString("en-GB")}. Funds stay with you until the owner confirms the truck.`, "good");
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
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl">
      <div className="relative overflow-hidden rounded-[30px] border border-line bg-[#f7f8fa] shadow-[0_32px_70px_-32px_rgba(15,23,42,0.28)]">
        <div className="absolute inset-x-0 top-0 h-22 bg-linear-to-r from-brand to-navy" aria-hidden="true" />
        <div className="absolute inset-x-0 top-18 h-20 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.18),transparent_55%)]" aria-hidden="true" />

        <div className="relative p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 overflow-hidden rounded-3xl border border-white/15 bg-linear-to-r from-brand via-brand-dark to-navy p-4 text-white shadow-[0_20px_40px_-22px_rgba(15,23,42,0.75)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/8 p-1.5 backdrop-blur-sm">
                <TruckThumb photos={truck.photos} alt={truck.plateNumber} className="h-16 w-16 rounded-xl object-cover sm:h-20 sm:w-20" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Selected truck</p>
                <h2 className="mt-1 truncate font-display text-xl text-white sm:text-2xl">{truck.truckType}</h2>
                <p className="mt-1 truncate text-sm text-white/80">
                  {truck.plateNumber} <span aria-hidden="true">·</span> {truck.currentLocation || "Location not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start rounded-2xl border border-white/15 bg-white/5 px-3 py-2 backdrop-blur-sm sm:self-center">
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">Capacity</p>
                <p className="mt-0.5 font-display text-xl text-white">{truck.capacity}<span className="ml-1 text-sm font-sans text-white/80">tons</span></p>
              </div>
              <Link
                href={`/trucks/${truck.id}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
                aria-label="View truck details"
                title="View truck details"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 17 17 7M7 7h10v10" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            <span className="rounded-full bg-brand-soft px-3 py-1.5 text-brand-dark ring-1 ring-brand/20">1 Cargo</span>
            <span className="rounded-full bg-white px-3 py-1.5 text-muted ring-1 ring-line">2 Journey</span>
            <span className="rounded-full bg-white px-3 py-1.5 text-muted ring-1 ring-line">3 Payment</span>
          </div>

          <section aria-labelledby="cargo-heading" className="rounded-3xl border border-line bg-white p-4 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.22)] sm:p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-soft">1</span>
                <div>
                  <h2 id="cargo-heading" className="font-display text-xl text-navy">Your cargo</h2>
                  <p className="mt-1 text-sm text-muted">Tell us what you are shipping.</p>
                </div>
              </div>
              <span className="hidden rounded-full border border-line bg-background px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-muted sm:inline-flex">Cargo</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                  <textarea className={`${inputClass} min-h-28 resize-y`} required value={form.cargoDescription} onChange={(e) => setForm({ ...form, cargoDescription: e.target.value })} placeholder="Describe the goods, packaging, or any special handling needs." />
                </Field>
              </div>
            </div>
          </section>

          <section aria-labelledby="journey-heading" className="mt-5 rounded-3xl border border-line bg-white p-4 shadow-[0_10px_28px_-22px_rgba(15,23,42,0.22)] sm:p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-soft">2</span>
                <div>
                  <h2 id="journey-heading" className="font-display text-xl text-navy">The journey</h2>
                  <p className="mt-1 text-sm text-muted">Choose the pickup and delivery route.</p>
                </div>
              </div>
              <span className="hidden rounded-full border border-line bg-background px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-muted sm:inline-flex">Route</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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

          <section aria-labelledby="payment-heading" className="mt-5 rounded-3xl border border-line bg-white p-4 shadow-soft sm:p-5">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">3</span>
              <div>
                <h2 id="payment-heading" className="text-xl font-semibold text-navy">Pay now</h2>
                <p className="mt-1 text-sm text-muted">Visa, Airtel Money, or MTN MoMo. The exact date and time are saved when you confirm.</p>
              </div>
            </div>
            <p className="mb-4 text-2xl font-semibold text-navy">{truck.priceRwf ? formatRwf(truck.priceRwf) : "Price unavailable"}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {([
                ["VISA", "Visa card"],
                ["AIRTEL", "Airtel Money"],
                ["MTN", "MTN MoMo"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMethod(value)}
                  className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold ${method === value ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-navy"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Name on the account">
                <input className={inputClass} required value={payerName} onChange={(event) => setPayerName(event.target.value)} placeholder="As it appears on the card or wallet" />
              </Field>
              {method === "VISA" ? (
                <>
                  <Field label="Card number">
                    <input className={inputClass} inputMode="numeric" autoComplete="cc-number" required value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} placeholder="ACCT-000015" />
                  </Field>
                  <Field label="Expiry">
                    <input className={inputClass} autoComplete="cc-exp" required value={expiry} onChange={(event) => setExpiry(event.target.value)} placeholder="MM/YY" />
                  </Field>
                  <Field label="Security code">
                    <input className={inputClass} inputMode="numeric" autoComplete="cc-csc" required value={cvv} onChange={(event) => setCvv(event.target.value)} placeholder="123" />
                  </Field>
                </>
              ) : (
                <Field label={method === "AIRTEL" ? "Airtel Money number" : "MTN MoMo number"}>
                  <input className={inputClass} type="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="07X XXX XXXX" />
                </Field>
              )}
            </div>
            <p className="mt-4 text-sm text-navy">The amount is collected now. It moves into the iBanga account only after the owner confirms the truck is available, and it is released after delivery is confirmed by both of you.</p>
          </section>

          {error ? <p role="alert" className="mt-5 rounded-xl border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">{error}</p> : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/trucks" className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-muted transition hover:bg-background hover:text-navy">Back to trucks</Link>
            <PrimaryButton className="w-full py-3 sm:w-auto sm:min-w-60" type="submit" disabled={submitting}>
              {submitting ? "Recording payment…" : "Pay and send request"}
              {!submitting ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg> : null}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function NewBookingPage() {
  return (
    <RequireAuth role="IMPORTER">
      <DashboardShell role="IMPORTER">
        <div className="min-h-screen bg-background">
          <div className="border-b border-line bg-card">
            <div className="mx-auto flex max-w-5xl justify-end px-4 py-3">
              <Link href="/trucks" className="text-sm font-semibold text-brand">
                Cancel
              </Link>
            </div>
          </div>
          <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
            <div className="mx-auto mb-7 max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Booking request</p>
              <h1 className="mt-2 font-display text-3xl text-navy sm:text-4xl">Request a freight booking</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                Share your shipment details and route requirements. We will forward the request to the truck owner for approval.
              </p>
            </div>
            <div className="mx-auto max-w-3xl rounded-[26px] border border-line bg-white/90 px-5 py-6 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.28)] sm:px-8 sm:py-8">
              <Suspense>
                <BookingForm />
              </Suspense>
            </div>
          </main>
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
