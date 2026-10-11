"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { BookingStatus } from "@/lib/types";

type LiveLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updatedAt: string;
};

type LiveTripTrackingProps = {
  bookingId: string;
  status: BookingStatus;
  canShare: boolean;
};

function openStreetMapEmbedUrl(location: LiveLocation) {
  const latitudeOffset = 0.012;
  const longitudeOffset =
    0.012 / Math.max(Math.cos((location.latitude * Math.PI) / 180), 0.2);
  const bounds = [
    location.longitude - longitudeOffset,
    location.latitude - latitudeOffset,
    location.longitude + longitudeOffset,
    location.latitude + latitudeOffset,
  ].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bounds}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`;
}

export function LiveTripTracking({
  bookingId,
  status,
  canShare,
}: LiveTripTrackingProps) {
  const [location, setLocation] = useState<LiveLocation | null>(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState(0);
  const latestPosition = useRef<GeolocationPosition | null>(null);
  const watchId = useRef<number | null>(null);
  const publishTimer = useRef<number | null>(null);
  const publishing = useRef(false);

  useEffect(() => {
    if (status !== "IN_PROGRESS") return;

    let cancelled = false;
    async function loadLocation() {
      try {
        const latest = await api<LiveLocation | null>(
          `/bookings/${bookingId}/location`,
        );
        if (!cancelled) {
          setLocation(latest);
          setClock(Date.now());
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load the truck’s location.",
          );
        }
      }
    }

    void loadLocation();
    const refreshTimer = canShare
      ? null
      : window.setInterval(() => void loadLocation(), 15_000);

    return () => {
      cancelled = true;
      if (refreshTimer !== null) window.clearInterval(refreshTimer);
    };
  }, [bookingId, canShare, status]);

  useEffect(() => {
    if (status !== "IN_PROGRESS") return;
    const clockTimer = window.setInterval(() => setClock(Date.now()), 15_000);
    return () => window.clearInterval(clockTimer);
  }, [status]);

  useEffect(
    () => () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      if (publishTimer.current !== null) {
        window.clearInterval(publishTimer.current);
      }
    },
    [],
  );

  async function publishLatestPosition() {
    const position = latestPosition.current;
    if (!position || publishing.current) return;

    publishing.current = true;
    try {
      const saved = await api<LiveLocation>(`/bookings/${bookingId}/location`, {
        method: "PATCH",
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      });
      setLocation(saved);
      setError(null);
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Could not share the latest location.",
      );
    } finally {
      publishing.current = false;
    }
  }

  function startSharing() {
    if (!navigator.geolocation) {
      setError("This browser does not support location sharing.");
      return;
    }

    setError(null);
    setSharing(true);
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        latestPosition.current = position;
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          updatedAt: new Date().toISOString(),
        });
        setClock(Date.now());
        void publishLatestPosition();
        if (publishTimer.current === null) {
          publishTimer.current = window.setInterval(
            () => void publishLatestPosition(),
            15_000,
          );
        }
      },
      (geoError) => {
        if (watchId.current !== null) {
          navigator.geolocation.clearWatch(watchId.current);
          watchId.current = null;
        }
        if (publishTimer.current !== null) {
          window.clearInterval(publishTimer.current);
          publishTimer.current = null;
        }
        setSharing(false);
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission was denied. Allow location access in your browser settings to share the trip."
            : geoError.code === geoError.POSITION_UNAVAILABLE
              ? "Your device could not determine its location. Check that location services are enabled."
              : "Location timed out. Please try sharing again.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    );
  }

  async function stopSharing() {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (publishTimer.current !== null) {
      window.clearInterval(publishTimer.current);
      publishTimer.current = null;
    }
    latestPosition.current = null;
    setSharing(false);
    setError(null);

    try {
      await api(`/bookings/${bookingId}/location`, { method: "DELETE" });
      setLocation(null);
    } catch (clearError) {
      setError(
        clearError instanceof Error
          ? clearError.message
          : "Could not stop sharing the saved location.",
      );
    }
  }

  if (status !== "IN_PROGRESS") return null;

  const mapUrl = location ? openStreetMapEmbedUrl(location) : null;
  const locationIsStale =
    location !== null &&
    clock > 0 &&
    clock - Date.parse(location.updatedAt) > 45_000;
  const mapLink = location
    ? `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=15/${location.latitude}/${location.longitude}`
    : null;

  return (
    <section
      aria-labelledby={`trip-location-heading-${bookingId}`}
      className="mt-4 overflow-hidden rounded-2xl border border-line bg-card shadow-soft"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-background/60 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            Active trip
          </p>
          <h2
            id={`trip-location-heading-${bookingId}`}
            className="mt-1 font-display text-lg text-navy"
          >
            {canShare ? "Share truck location" : "Live truck location"}
          </h2>
        </div>
        {canShare ? (
          sharing ? (
            <button
              type="button"
              onClick={() => void stopSharing()}
              className="rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-navy transition hover:border-bad/30 hover:text-bad"
            >
              Stop sharing
            </button>
          ) : (
            <button
              type="button"
              onClick={startSharing}
              className="rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Start sharing
            </button>
          )
        ) : (
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
              location && !locationIsStale
                ? "bg-good-soft text-good"
                : "bg-warn-soft text-warn"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                location && !locationIsStale
                  ? "animate-pulse bg-good"
                  : "bg-warn"
              }`}
            />
            {location
              ? locationIsStale
                ? "Last known location"
                : "Live updates"
              : "Waiting for location"}
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {canShare ? (
          <p className="mb-3 text-sm leading-relaxed text-muted">
            Your device location is shared with the importer only while this
            trip is active. Keep this page open for updates every 15 seconds.
          </p>
        ) : null}

        {mapUrl ? (
          <>
            <iframe
              title="OpenStreetMap view of the truck’s latest location"
              src={mapUrl}
              loading="lazy"
              className="h-64 w-full rounded-xl border border-line bg-background sm:h-80"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span>
                {locationIsStale ? "Last known position · " : ""}
                {location
                  ? `Updated ${new Date(location.updatedAt).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" },
                    )}`
                  : ""}
                {location?.accuracy
                  ? ` · Accuracy ±${Math.round(location.accuracy)} m`
                  : ""}
              </span>
              {mapLink ? (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brand hover:text-brand-dark"
                >
                  Open full map
                </a>
              ) : null}
            </div>
            <p className="mt-1 text-right text-[10px] text-muted">
              Map data © OpenStreetMap contributors
            </p>
          </>
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-line bg-background px-5 py-8 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </span>
            <p className="mt-3 text-sm font-semibold text-navy">
              {canShare
                ? sharing
                  ? "Waiting for your device location…"
                  : "Location sharing is off"
                : "Waiting for the owner to share location"}
            </p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
              {canShare
                ? "Start sharing and allow your browser to access this device’s location."
                : "The map will appear here when the truck owner starts sharing during the trip."}
            </p>
          </div>
        )}

        {error ? (
          <p role="alert" className="mt-3 rounded-xl bg-bad-soft px-3.5 py-2.5 text-sm text-bad">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
