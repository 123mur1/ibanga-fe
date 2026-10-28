import type { TruckStatus } from "@/lib/types";
import type { TruckProfile } from "@/types/ops";

/** A new operations profile for a truck that has none yet. */
export function emptyTruckProfile(truckId: string, status: TruckStatus = "AVAILABLE"): TruckProfile {
  return {
    id: `tp-${truckId}`,
    truckId,
    opsStatus: status === "AVAILABLE" ? "AVAILABLE" : "RESERVED",
    lengthM: 0,
    widthM: 0,
    heightM: 0,
    volumeM3: 0,
    suitability: [],
    verification: "NOT_SUBMITTED",
    tripsCompleted: 0,
    onTimeRate: 0,
    utilizationPct: 0,
  };
}
