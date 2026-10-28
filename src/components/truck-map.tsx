"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";
import { geocode } from "@/lib/geo";

type LatLng = [number, number];

export type MapPosition = { lat: number; lng: number };

function straightLine(from: LatLng, to: LatLng, steps = 80): LatLng[] {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t] as LatLng;
  });
}

function haversine(a: LatLng, b: LatLng) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const h =
    Math.sin(toRad(b[0] - a[0]) / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(toRad(b[1] - a[1]) / 2) ** 2;
  return 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Point at `fraction` (0–1) of the way along the path, plus the path walked so far. */
function walk(path: LatLng[], fraction: number): { point: LatLng; done: LatLng[] } {
  const lengths = path.slice(1).map((point, index) => haversine(path[index], point));
  const total = lengths.reduce((sum, value) => sum + value, 0) || 1;
  let remaining = Math.max(0, Math.min(1, fraction)) * total;
  const done: LatLng[] = [path[0]];
  for (let index = 0; index < lengths.length; index += 1) {
    if (remaining <= lengths[index] || index === lengths.length - 1) {
      const t = lengths[index] ? Math.min(1, remaining / lengths[index]) : 0;
      const a = path[index];
      const b = path[index + 1];
      const point: LatLng = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      done.push(point);
      return { point, done };
    }
    remaining -= lengths[index];
    done.push(path[index + 1]);
  }
  return { point: path[path.length - 1], done };
}

/** The route walked up to a GPS fix: the path to its nearest vertex, then the fix itself. */
function walkTo(path: LatLng[], fix: LatLng): LatLng[] {
  let nearest = 0;
  let best = Infinity;
  path.forEach((point, index) => {
    const distance = haversine(point, fix);
    if (distance < best) {
      best = distance;
      nearest = index;
    }
  });
  return [...path.slice(0, nearest + 1), fix];
}

/**
 * Real OpenStreetMap map of a trip. Place names are geocoded and the route follows the roads when
 * the routing service answers. The truck sits at `position` (a GPS fix) when one is given;
 * otherwise at `progress` along the route, which is an estimate.
 */
export function TruckMap({
  pickup,
  destination,
  progress,
  moving,
  position,
  onRouteKm,
}: {
  pickup: string;
  destination: string;
  /** Fraction of the route covered, 0–1. Used when there is no GPS position. */
  progress: number;
  /** Shows the pulsing "live" marker while the truck is on the road. */
  moving: boolean;
  /** Latest GPS fix for the truck, if one has been shared. */
  position?: MapPosition | null;
  /** Receives the road distance in km once the route is known. */
  onRouteKm?: (km: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const truckRef = useRef<Marker | null>(null);
  const doneLineRef = useRef<Polyline | null>(null);
  const pathRef = useRef<LatLng[]>([]);
  const shownRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const progressRef = useRef(progress);
  const positionRef = useRef(position);
  const onRouteKmRef = useRef(onRouteKm);
  const animateRef = useRef<((target: number) => void) | null>(null);
  const placeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    progressRef.current = progress;
    positionRef.current = position;
    onRouteKmRef.current = onRouteKm;
  });

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const [L, start, end] = await Promise.all([
        import("leaflet").then((module) => module.default),
        geocode(pickup),
        geocode(destination),
      ]);
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: true });
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const pin = (color: string, inner: string) =>
        L.divIcon({
          className: "",
          iconSize: [22, 22],
          iconAnchor: [11, 11],
          html: `<span style="display:flex;height:22px;width:22px;align-items:center;justify-content:center;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"><span style="height:6px;width:6px;border-radius:9999px;background:${inner}"></span></span>`,
        });
      const truckIcon = L.divIcon({
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        html: `<span class="truck-pin${moving ? " truck-pin-live" : ""}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/></svg></span>`,
      });

      L.marker(start, { icon: pin("#ffffff", "#00628b") }).addTo(map).bindTooltip(pickup);
      L.marker(end, { icon: pin("#00628b", "#ffffff") }).addTo(map).bindTooltip(destination);

      pathRef.current = straightLine(start, end);
      const remainingLine = L.polyline(pathRef.current, { color: "#00628b", weight: 4, opacity: 0.35, dashArray: "8 10" }).addTo(map);
      const doneLine = L.polyline([start], { color: "#00628b", weight: 6, opacity: 0.95, lineCap: "round" }).addTo(map);
      doneLineRef.current = doneLine;
      const truck = L.marker(start, { icon: truckIcon, zIndexOffset: 1000 }).addTo(map).bindTooltip("Estimated truck position");
      truckRef.current = truck;

      map.fitBounds(L.latLngBounds([start, end]), { padding: [48, 48] });

      const redraw = (fraction: number) => {
        const { point, done } = walk(pathRef.current, fraction);
        truck.setLatLng(point);
        doneLine.setLatLngs(done);
      };

      const animateTo = (target: number) => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        const from = shownRef.current;
        const began = performance.now();
        const duration = Math.min(5000, 1200 + Math.abs(target - from) * 6000);
        const tick = (now: number) => {
          const t = Math.min(1, (now - began) / duration);
          const eased = 1 - (1 - t) ** 3;
          shownRef.current = from + (target - from) * eased;
          redraw(shownRef.current);
          if (t < 1) frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
      };

      /** Puts the truck at the GPS fix when there is one, otherwise at the estimated progress. */
      const place = () => {
        const fix = positionRef.current;
        if (fix) {
          if (frameRef.current) cancelAnimationFrame(frameRef.current);
          const point: LatLng = [fix.lat, fix.lng];
          truck.setLatLng(point);
          truck.setTooltipContent("Last shared GPS position");
          doneLine.setLatLngs(walkTo(pathRef.current, point));
        } else {
          truck.setTooltipContent("Estimated truck position");
          animateTo(progressRef.current);
        }
      };
      animateRef.current = animateTo;
      placeRef.current = place;
      place();

      // Follow the real roads when the routing service answers; keep the straight line otherwise.
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`,
        );
        if (!response.ok) throw new Error("routing unavailable");
        const data = (await response.json()) as { routes?: { distance: number; geometry: { coordinates: [number, number][] } }[] };
        const route = data.routes?.[0];
        const coordinates = route?.geometry.coordinates;
        if (cancelled || !route || !coordinates || coordinates.length < 2) return;
        pathRef.current = coordinates.map(([lng, lat]) => [lat, lng] as LatLng);
        remainingLine.setLatLngs(pathRef.current);
        if (positionRef.current) place();
        else redraw(shownRef.current);
        map.fitBounds(L.latLngBounds(pathRef.current), { padding: [48, 48] });
        onRouteKmRef.current?.(Math.round(route.distance / 1000));
      } catch {
        /* straight-line route stays */
      }
    }

    void setup();

    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      mapRef.current?.remove();
      mapRef.current = null;
      truckRef.current = null;
      doneLineRef.current = null;
      animateRef.current = null;
      placeRef.current = null;
    };
  }, [pickup, destination, moving]);

  useEffect(() => {
    placeRef.current?.();
  }, [progress, position?.lat, position?.lng]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`Map showing the truck travelling from ${pickup} to ${destination}`}
      className="h-[26rem] w-full overflow-hidden rounded-xl border border-line bg-background"
    />
  );
}
