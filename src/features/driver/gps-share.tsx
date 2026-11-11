"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/toast";
import { Icon } from "@/features/importer-dashboard/kit";
import { api } from "@/lib/api";

/** At most one position sent per this many milliseconds while live sharing. */
const SEND_EVERY_MS = 60_000;

function send(bookingId: string, position: GeolocationPosition) {
  return api(`/bookings/${encodeURIComponent(bookingId)}/location`, {
    method: "PATCH",
    body: JSON.stringify({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: Math.min(10000, Math.round(position.coords.accuracy)),
    }),
  });
}

/**
 * Shares the phone's GPS position with the importer's tracking map while the trip is on the road.
 * The server accepts it only from the truck's driver or owner, and only during an active trip.
 */
export function GpsShare({ bookingId }: { bookingId: string }) {
  const toast = useToast();
  const [live, setLive] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const sentAt = useRef(0);

  useEffect(() => {
    if (!live) return;
    if (!("geolocation" in navigator)) {
      toast("This device cannot share its location.", "bad");
      return;
    }
    const watch = navigator.geolocation.watchPosition(
      (position) => {
        if (Date.now() - sentAt.current < SEND_EVERY_MS) return;
        sentAt.current = Date.now();
        send(bookingId, position)
          .then(() => setLastSent(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })))
          .catch((error: unknown) => toast(error instanceof Error ? error.message : "Could not share the location.", "bad"));
      },
      (error) => {
        toast(error.code === error.PERMISSION_DENIED ? "Allow location access to share the truck's position." : "Could not read the GPS position.", "bad");
        setLive(false);
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [live, bookingId, toast]);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${live ? "border-good/30 bg-good-soft/60" : "border-line bg-background"}`}>
      <div className="flex items-center gap-3">
        <span className={`relative flex h-9 w-9 items-center justify-center rounded-full ${live ? "bg-good text-white" : "bg-brand-soft text-brand"}`}>
          <Icon name="pin" className="h-4 w-4" />
          {live ? <span className="absolute inset-0 animate-ping rounded-full bg-good/40" aria-hidden="true" /> : null}
        </span>
        <div>
          <p className="text-sm font-semibold text-navy">{live ? "Sharing live location" : "Live location is off"}</p>
          <p className="text-xs text-muted">{live ? (lastSent ? `Last sent at ${lastSent}, about once a minute.` : "Waiting for the first GPS fix…") : "The importer sees the truck on the map while you share."}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setLive((value) => !value)}
        aria-pressed={live}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${live ? "border border-good/40 bg-white text-good hover:bg-good-soft" : "bg-good text-white shadow-soft hover:bg-good/90"}`}
      >
        {live ? "Stop sharing" : "Share location"}
      </button>
    </div>
  );
}
