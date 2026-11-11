import { geocode } from "./geo";

/**
 * Road distance between two places, used to price a trip (distance × the vehicle's rate per km).
 *
 * With NEXT_PUBLIC_GOOGLE_MAPS_API_KEY set, the distance comes from the Google Maps Routes API
 * (driving route). Without a key, or if Google cannot answer, it falls back to an estimate: the
 * straight-line distance times a typical road factor. The result says which one it is, so the UI
 * can label an estimate. The server recalculates the price when the booking is saved.
 */

export type RouteDistance = {
  km: number;
  /** Driving time in minutes, when Google provides it. */
  minutes: number | null;
  source: "google" | "estimate";
};

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
export const googleMapsConfigured = GOOGLE_KEY.length > 0;

/** Roads are longer than the straight line between towns; 1.3 is typical for the region. */
const ROAD_FACTOR = 1.3;

/** Country for each listed place, so Google finds the right town ("Huye, Rwanda"). */
const COUNTRY: Record<string, string> = {
  kigali: "Rwanda",
  musanze: "Rwanda",
  huye: "Rwanda",
  gisenyi: "Rwanda",
  rubavu: "Rwanda",
  rusizi: "Rwanda",
  nyagatare: "Rwanda",
  muhanga: "Rwanda",
  rwamagana: "Rwanda",
  rusumo: "Rwanda",
  gatuna: "Rwanda",
  kagitumba: "Rwanda",
  goma: "Democratic Republic of the Congo",
  bujumbura: "Burundi",
  kampala: "Uganda",
  nairobi: "Kenya",
  mombasa: "Kenya",
  isaka: "Tanzania",
  "dar es salaam": "Tanzania",
};

function address(place: string) {
  const country = COUNTRY[place.trim().toLowerCase()];
  return country ? `${place.trim()}, ${country}` : place.trim();
}

function haversineKm(a: [number, number], b: [number, number]) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

async function googleDistance(from: string, to: string): Promise<RouteDistance | null> {
  if (!googleMapsConfigured) return null;
  try {
    const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_KEY,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
      },
      body: JSON.stringify({
        origin: { address: address(from) },
        destination: { address: address(to) },
        travelMode: "DRIVE",
        units: "METRIC",
      }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { routes?: { distanceMeters?: number; duration?: string }[] };
    const route = data.routes?.[0];
    if (!route?.distanceMeters) return null;
    const seconds = Number.parseInt(route.duration ?? "", 10);
    return {
      km: Math.max(1, Math.round(route.distanceMeters / 1000)),
      minutes: Number.isFinite(seconds) ? Math.round(seconds / 60) : null,
      source: "google",
    };
  } catch {
    return null;
  }
}

async function estimatedDistance(from: string, to: string): Promise<RouteDistance> {
  const [a, b] = await Promise.all([geocode(from), geocode(to)]);
  return { km: Math.max(1, Math.round(haversineKm(a, b) * ROAD_FACTOR)), minutes: null, source: "estimate" };
}

const cache = new Map<string, Promise<RouteDistance>>();

/** Driving distance from `from` to `to`, cached for the session. */
export function measureDistance(from: string, to: string): Promise<RouteDistance> {
  const key = `${from.trim().toLowerCase()}→${to.trim().toLowerCase()}`;
  let result = cache.get(key);
  if (!result) {
    result = googleDistance(from, to).then((google) => google ?? estimatedDistance(from, to));
    cache.set(key, result);
  }
  return result;
}

/** Trip price: whole RWF, distance times rate. */
export function tripPrice(km: number, pricePerKmRwf: number): number {
  return Math.round(km * pricePerKmRwf);
}

export function formatRate(pricePerKmRwf: number | null | undefined): string {
  return pricePerKmRwf == null ? "Rate not set" : `RWF ${pricePerKmRwf.toLocaleString("en-RW")} / km`;
}

export function formatDuration(minutes: number | null): string | null {
  if (minutes == null) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} h ${rest ? `${rest} min` : ""}`.trim() : `${rest} min`;
}
