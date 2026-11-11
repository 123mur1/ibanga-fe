import type { DateRange } from "@/components/availability-calendar";
import { isRangeFree, todayKey } from "@/lib/availability";
import { countryOfCity } from "@/lib/locations";
import type { BookedRange, TripQuote, Truck } from "@/lib/types";

export type Place = { country: string; city: string; area: string };

export type WizardForm = {
  dates: DateRange | null;
  pickup: Place;
  destination: Place;
  cargoType: string;
  cargoWeight: string;
  cargoDescription: string;
  additionalInstructions: string;
};

export const STEPS = [
  { id: "dates", title: "Dates", text: "When you need the truck" },
  { id: "route", title: "Route", text: "Pickup and destination" },
  { id: "cargo", title: "Cargo", text: "What you are shipping" },
  { id: "review", title: "Review", text: "Check and send" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export function emptyPlace(city = ""): Place {
  return { country: countryOfCity(city), city, area: "" };
}

/** Cities the vehicle works in: where it is now plus the places it serves. */
export function servedCities(truck: Truck) {
  return new Set([truck.currentLocation, ...(truck.destinations ?? [])].filter(Boolean));
}

export function samePlace(a: Place, b: Place) {
  return a.city === b.city && a.area.trim().toLowerCase() === b.area.trim().toLowerCase();
}

type StepErrors = Partial<Record<string, string>>;

/** Inline messages for one step; an empty object means the step is complete. */
export function validateStep(
  step: StepId,
  form: WizardForm,
  context: { truck: Truck; booked: BookedRange[]; quote: TripQuote | null; quoteLoading: boolean; quoteError: string | null },
): StepErrors {
  const errors: StepErrors = {};
  if (step === "dates") {
    if (!form.dates) errors.dates = "Choose the days you need the truck.";
    else if (form.dates.start < todayKey()) errors.dates = "Those dates have passed. Choose new dates.";
    else if (!isRangeFree(form.dates.start, form.dates.end, context.booked)) errors.dates = "Some of those days are already booked. Choose other dates.";
  }
  if (step === "route") {
    if (!form.pickup.city) errors.pickup = "Choose the pickup country and city.";
    else if (!form.pickup.area.trim()) errors.pickup = "Choose or type the pickup area.";
    if (!form.destination.city) errors.destination = "Choose the destination country and city.";
    else if (!form.destination.area.trim()) errors.destination = "Choose or type the destination area.";
    if (!errors.pickup && !errors.destination) {
      if (samePlace(form.pickup, form.destination)) errors.destination = "The destination must differ from the pickup.";
      else if (context.quoteLoading) errors.quote = "We are still pricing the trip. One moment.";
      else if (context.quoteError) errors.quote = context.quoteError;
      else if (!context.quote) errors.quote = "The trip could not be priced yet.";
    }
  }
  if (step === "cargo") {
    const weight = Number(form.cargoWeight);
    if (!form.cargoType) errors.cargoType = "Choose the cargo type.";
    if (!form.cargoWeight || !Number.isFinite(weight) || weight <= 0) errors.cargoWeight = "Enter the cargo weight in tons.";
    else if (weight > context.truck.capacity) errors.cargoWeight = `This truck carries up to ${context.truck.capacity} tons.`;
    if (form.cargoDescription.trim().length < 5) errors.cargoDescription = "Describe the goods in a few words.";
  }
  return errors;
}
