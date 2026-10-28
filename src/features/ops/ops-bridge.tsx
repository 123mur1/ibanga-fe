"use client";

import { useEffect } from "react";
import { env } from "@/config/env";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import { setDirectory } from "@/services/mock/directory";

/**
 * Connects the marketplace store (users, trucks, bookings) to the operations services.
 *
 * - Publishes marketplace data to the mock directory so services can validate ownership,
 *   capacity and payment state. A real backend reads this from its own database instead.
 * - Creates shipments and settlements for bookings that moved forward from any screen.
 *
 * The directory is set during render on purpose: child pages may call services in their first
 * effect, and effects run after every render has finished, so the data is always ready by then.
 */
export function OpsBridge() {
  const { currentUser, users, trucks, bookings } = useIbanga();
  setDirectory({ users, trucks, bookings });

  useEffect(() => {
    if (!bookings.length) return;
    if (
      env.dataSource === "api" &&
      currentUser?.role !== "TRUCK_OWNER"
    ) {
      return;
    }
    void services.shipments.syncFromBookings(bookings).catch((error: unknown) => {
      console.error("Could not sync shipments.", error);
    });
  }, [bookings, currentUser, trucks]);

  return null;
}
