const PLACES: Record<string, [number, number]> = {
  kigali: [-1.9441, 30.0619],
  mombasa: [-4.0435, 39.6682],
  nairobi: [-1.2921, 36.8219],
  kampala: [0.3476, 32.5825],
  "dar es salaam": [-6.7924, 39.2083],
  rusumo: [-2.3833, 30.7833],
  gisenyi: [-1.7028, 29.2564],
  rubavu: [-1.7028, 29.2564],
  musanze: [-1.4998, 29.6348],
  huye: [-2.5967, 29.7394],
};

export function locate(name: string): [number, number] {
  const key = name.toLowerCase();
  const match = Object.keys(PLACES)
    .sort((a, b) => b.length - a.length)
    .find((place) => key.includes(place));
  if (match) return PLACES[match];
  let hash = 0;
  for (const char of name) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return [-2.2 + (hash % 400) / 200, 29.2 + ((hash >> 9) % 700) / 100];
}

function haversineKm(a: [number, number], b: [number, number]) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function positionAt(from: string, to: string, km: number) {
  const start = locate(from);
  const end = locate(to);
  const totalKm = Math.max(2, Math.round(haversineKm(start, end)));
  const travelled = Math.max(0, Math.min(km, totalKm));
  const progress = travelled / totalKm;
  return {
    lat: start[0] + (end[0] - start[0]) * progress,
    lng: start[1] + (end[1] - start[1]) * progress,
    totalKm,
    travelled,
  };
}
