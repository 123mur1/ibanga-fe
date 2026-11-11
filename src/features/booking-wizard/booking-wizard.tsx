"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AvailabilityDialog } from "@/components/availability-calendar";
import { useToast } from "@/components/toast";
import { PrimaryButton } from "@/components/ui";
import { useBookedRanges } from "@/hooks/use-booked-ranges";
import { UNVERIFIED_TRUCK_MESSAGE, useTruckVerification } from "@/hooks/use-truck-verification";
import { formatRwf } from "@/lib/payments";
import { useIbanga } from "@/lib/store";
import type { Truck } from "@/lib/types";
import { BookingSummary, StepIndicator } from "./chrome";
import { ReviewStep, SuccessDialog } from "./review";
import { emptyPlace, servedCities, STEPS, validateStep, type StepId, type WizardForm } from "./state";
import { CargoStep, DatesStep, RouteStep } from "./steps";
import { useTripQuote } from "./use-trip-quote";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function Notice({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-6 text-center shadow-soft">
      <p className="font-semibold text-navy">{title}</p>
      <p className="mx-auto mt-1 max-w-lg text-sm text-muted">{text}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-4">{children}</div>
    </div>
  );
}

export function BookingWizard() {
  const params = useSearchParams();
  const truckId = params.get("truck") ?? "";
  const router = useRouter();
  const toast = useToast();
  const { currentUser, createBooking, fetchTruck } = useIbanga();
  const bookedFor = useBookedRanges();
  const [truck, setTruck] = useState<Truck | null>(null);
  const [loadedTruckId, setLoadedTruckId] = useState<string | null>(null);
  const [form, setForm] = useState<WizardForm>(() => {
    const from = params.get("from") ?? "";
    const to = params.get("to") ?? from;
    return {
      dates: DATE_KEY.test(from) && DATE_KEY.test(to) && to >= from ? { start: from, end: to } : null,
      pickup: emptyPlace(),
      destination: emptyPlace(),
      cargoType: "",
      cargoWeight: params.get("quantity") ?? "",
      cargoDescription: "",
      additionalInstructions: "",
    };
  });
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [attempted, setAttempted] = useState<Set<StepId>>(() => new Set());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (!truckId) return;
    fetchTruck(truckId)
      .then((selected) => {
        setTruck(selected);
        // The cargo is usually where the truck is; the importer can change it.
        setForm((current) => (current.pickup.city ? current : { ...current, pickup: emptyPlace(selected.currentLocation) }));
        setLoadedTruckId(truckId);
      })
      .catch(() => {
        setTruck(null);
        setLoadedTruckId(truckId);
      });
  }, [truckId, fetchTruck]);

  // Move focus to the new step's title so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const quote = useTripQuote(truck?.id ?? "", form.pickup, form.destination);
  const verification = useTruckVerification(truck);

  if (truckId && loadedTruckId !== truckId) {
    return <p className="py-10 text-center text-sm text-muted">Loading vehicle details…</p>;
  }
  if (!truck) {
    return (
      <Notice title="Choose a vehicle to continue" text="Pick a vehicle and your dates before starting a booking.">
        <Link href="/#available-trucks" className="text-sm font-semibold text-brand hover:text-brand-dark">Find a vehicle</Link>
      </Notice>
    );
  }
  // Someone can still open this page with a direct link; unverified vehicles are never bookable.
  if (verification !== "APPROVED") {
    return (
      <Notice title="This vehicle cannot be booked yet" text={UNVERIFIED_TRUCK_MESSAGE}>
        <Link href={`/trucks/${truck.id}`} className="text-sm font-semibold text-brand hover:text-brand-dark">View vehicle details</Link>
        <Link href="/#available-trucks" className="text-sm font-semibold text-brand hover:text-brand-dark">Find verified vehicles</Link>
      </Notice>
    );
  }

  const booked = bookedFor(truck);
  const served = servedCities(truck);
  const current = STEPS[step];
  const context = { truck, booked, quote: quote.quote, quoteLoading: quote.loading, quoteError: quote.error };
  const errors = attempted.has(current.id) ? validateStep(current.id, form, context) : {};

  const update = (patch: Partial<WizardForm>) => {
    setForm((previous) => ({ ...previous, ...patch }));
    setSubmitError(null);
  };
  const goTo = (index: number) => {
    setDirection(index < step ? "back" : "forward");
    setStep(index);
  };
  const next = () => {
    setAttempted((previous) => new Set(previous).add(current.id));
    if (Object.keys(validateStep(current.id, form, context)).length) return;
    const target = step + 1;
    setFurthest((previous) => Math.max(previous, target));
    goTo(target);
  };

  async function submit() {
    if (!currentUser || !truck || !form.dates || !quote.quote || submitting) return;
    const invalid = STEPS.findIndex((item) => Object.keys(validateStep(item.id, form, context)).length > 0);
    if (invalid !== -1 && invalid < STEPS.length - 1) {
      setAttempted(new Set(STEPS.map((item) => item.id)));
      goTo(invalid);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const error = await createBooking(truck, {
        truckId: truck.id,
        importerId: currentUser.id,
        cargoType: form.cargoType,
        cargoDescription: form.cargoDescription.trim(),
        cargoWeight: form.cargoWeight,
        additionalInstructions: form.additionalInstructions.trim(),
        pickupLocation: form.pickup.city,
        destination: form.destination.city,
        pickupCountry: form.pickup.country,
        pickupCity: form.pickup.city,
        pickupArea: form.pickup.area.trim(),
        destinationCountry: form.destination.country,
        destinationCity: form.destination.city,
        destinationArea: form.destination.area.trim(),
        pickupDate: form.dates.start,
        expectedDeliveryDate: form.dates.end,
        distanceKm: quote.quote.km,
        pricePerKmRwf: quote.quote.pricePerKmRwf,
        agreedPriceRwf: quote.quote.priceRwf,
        agreedPrice: formatRwf(quote.quote.priceRwf),
      });
      if (error) {
        setSubmitError(error);
        toast(error, "bad");
        return;
      }
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  const last = step === STEPS.length - 1;
  return (
    <div className="space-y-5">
      <StepIndicator current={step} furthest={furthest} onSelect={goTo} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="order-2 min-w-0 lg:order-1">
          <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft" aria-labelledby="wizard-step-title">
            <div className="h-1 bg-gradient-to-r from-brand via-accent to-good" aria-hidden="true" />
            <div key={current.id} className={`p-4 sm:p-6 ${direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left"}`}>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Step {step + 1} of {STEPS.length}</p>
              <h2 id="wizard-step-title" ref={headingRef} tabIndex={-1} className="mt-1 font-display text-2xl text-navy outline-none">
                {current.id === "dates" ? "When do you need the truck?" : current.id === "route" ? "Where is the cargo going?" : current.id === "cargo" ? "What are you shipping?" : "Check and send your request"}
              </h2>
              <p className="mb-5 mt-1 text-sm text-muted">{current.text}.</p>
              {current.id === "dates" ? <DatesStep form={form} errors={errors} onOpenCalendar={() => setCalendarOpen(true)} /> : null}
              {current.id === "route" ? <RouteStep truck={truck} form={form} update={update} errors={errors} served={served} quote={quote} /> : null}
              {current.id === "cargo" ? <CargoStep truck={truck} form={form} update={update} errors={errors} /> : null}
              {current.id === "review" ? <ReviewStep truck={truck} form={form} quote={quote.quote} goTo={(id) => goTo(STEPS.findIndex((item) => item.id === id))} /> : null}
            </div>
            {submitError ? <p role="alert" className="mx-4 mb-4 rounded-xl border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad sm:mx-6">{submitError}</p> : null}
            <div className="flex flex-col-reverse gap-3 border-t border-line bg-background/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              {step === 0 ? (
                <Link href={`/trucks/${truck.id}`} className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-muted transition hover:bg-card hover:text-navy">Back to vehicle</Link>
              ) : (
                <button type="button" onClick={() => goTo(step - 1)} className="rounded-xl border border-line bg-card px-5 py-3 text-sm font-semibold text-navy transition hover:border-brand hover:text-brand">Back</button>
              )}
              <PrimaryButton
                type="button"
                className="w-full py-3 sm:w-auto sm:min-w-56"
                disabled={submitting}
                onClick={last ? () => void submit() : next}
              >
                {last ? (submitting ? "Sending request…" : "Send request · pay nothing now") : "Continue"}
                {!submitting ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg> : null}
              </PrimaryButton>
            </div>
          </section>
        </div>
        <div className="order-1 lg:order-2">
          <BookingSummary truck={truck} form={form} quote={quote.quote} />
        </div>
      </div>

      {calendarOpen ? (
        <AvailabilityDialog
          title="Choose your dates"
          vehicleLabel={`${truck.truckType} · ${truck.plateNumber} · booked days are in red`}
          booked={booked}
          initial={form.dates}
          onClose={() => setCalendarOpen(false)}
          onContinue={(range) => {
            update({ dates: range });
            setCalendarOpen(false);
          }}
        />
      ) : null}
      {sent ? <SuccessDialog deposit={quote.quote?.depositRwf ?? null} onBrowse={() => router.push("/#available-trucks")} /> : null}
    </div>
  );
}
