"use client";

import { useEffect, useState } from "react";
import { fetchTripQuote } from "@/lib/booking-stage";
import type { TripQuote } from "@/lib/types";
import { samePlace, type Place } from "./state";

type Result = { key: string; quote: TripQuote | null; error: string | null };

/**
 * The server's price for the trip, refetched (debounced) whenever the pickup or destination
 * changes. While the latest route is being priced, `loading` is true and the old quote is hidden.
 */
export function useTripQuote(truckId: string, pickup: Place, destination: Place) {
  const ready = Boolean(truckId && pickup.city && destination.city && !samePlace(pickup, destination));
  const key = ready
    ? JSON.stringify([truckId, pickup.city, pickup.area.trim(), destination.city, destination.area.trim()])
    : "";
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const [id, pickupCity, pickupArea, destinationCity, destinationArea] = JSON.parse(key) as string[];
    const timer = window.setTimeout(() => {
      fetchTripQuote(id, { pickupCity, pickupArea, destinationCity, destinationArea })
        .then((quote) => {
          if (!cancelled) setResult({ key, quote, error: null });
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setResult({ key, quote: null, error: error instanceof Error ? error.message : "We could not price this trip. Try again." });
          }
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [key]);

  const current = key && result?.key === key ? result : null;
  return {
    quote: current?.quote ?? null,
    error: current?.error ?? null,
    loading: Boolean(key) && !current,
  };
}
