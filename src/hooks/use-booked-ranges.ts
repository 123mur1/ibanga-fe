"use client";

import { useCallback, useMemo } from "react";
import { bookedRangesFromBookings } from "@/lib/availability";
import { useIbanga } from "@/lib/store";
import type { BookedRange, Truck } from "@/lib/types";

/**
 * Booked days for a vehicle: what the API reports for it, plus any live bookings this viewer can
 * already see, so a booking just made shows up straight away.
 */
export function useBookedRanges() {
  const { bookings } = useIbanga();
  const known = useMemo(() => {
    const byTruck = new Map<string, BookedRange[]>();
    for (const truckId of new Set(bookings.map((booking) => booking.truckId))) {
      byTruck.set(truckId, bookedRangesFromBookings(truckId, bookings));
    }
    return byTruck;
  }, [bookings]);

  return useCallback(
    (truck: Pick<Truck, "id" | "bookedRanges">): BookedRange[] => {
      const seen = new Set<string>();
      return [...(truck.bookedRanges ?? []), ...(known.get(truck.id) ?? [])]
        .filter((range) => {
          const key = `${range.start}/${range.end}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => a.start.localeCompare(b.start));
    },
    [known],
  );
}
