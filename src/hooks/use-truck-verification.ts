"use client";

import { truckVerification } from "@/config/business-rules";
import { useOps } from "@/hooks/use-ops";
import type { Truck } from "@/lib/types";

/** Shown wherever an unverified truck would otherwise offer a booking. The API sends the same rule. */
export const UNVERIFIED_TRUCK_MESSAGE =
  "This truck is not verified yet, so it cannot be booked. An administrator must approve its registration, inspection and insurance first.";

/**
 * A truck's verification: the API sends it with the truck; when it is missing it is worked out
 * from the loaded documents with the same rule. Unverified trucks stay visible but cannot be booked.
 */
export function useTruckVerification(truck: Pick<Truck, "id" | "verification"> | null | undefined) {
  const { documents } = useOps();
  if (!truck) return undefined;
  return truck.verification ?? truckVerification(truck.id, documents);
}

/** A check for lists: whether a truck is verified, with the same rule as above. */
export function useIsTruckVerified() {
  const { documents } = useOps();
  return (truck: Pick<Truck, "id" | "verification">) =>
    (truck.verification ?? truckVerification(truck.id, documents)) === "APPROVED";
}
