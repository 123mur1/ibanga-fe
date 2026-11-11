/**
 * Country → city → area, for the pickup and the destination of a booking. Cities are the places
 * vehicles serve (LOCATIONS in types.ts) and are what prices use; areas narrow the address.
 * The backend keeps the same tree in src/trucks/marketplace.ts (PLACES and CITY_AREAS).
 */
export const LOCATION_TREE: Record<string, Record<string, string[]>> = {
  Rwanda: {
    Kigali: ["Nyarugenge", "Gasabo", "Kicukiro", "Nyabugogo", "Remera", "Kimironko", "Kanombe", "Gikondo", "Masaka", "Kigali Special Economic Zone"],
    Musanze: ["Muhoza", "Cyuve", "Kinigi", "Busogo"],
    Huye: ["Ngoma", "Tumba", "Mbazi", "Rusatira"],
    Gisenyi: ["Gisenyi", "Nyamyumba", "Rugerero", "Petite Barrière border"],
    Rusizi: ["Kamembe", "Gihundwe", "Bugarama", "Rusizi I border"],
    Nyagatare: ["Nyagatare town", "Matimba", "Rwimiyaga", "Karangazi"],
    Muhanga: ["Nyamabuye", "Shyogwe", "Kabacuzi"],
    Rwamagana: ["Kigabiro", "Muhazi", "Fumbwe"],
    Rusumo: ["Rusumo border post", "Kirehe", "Nyakarambi"],
    Gatuna: ["Gatuna border post", "Kaniga"],
    Kagitumba: ["Kagitumba border post", "Matimba"],
  },
  "Democratic Republic of the Congo": {
    Goma: ["Himbi", "Katindo", "Birere", "Mabanga"],
  },
  Burundi: {
    Bujumbura: ["Rohero", "Buyenzi", "Kinama", "Port of Bujumbura"],
  },
  Uganda: {
    Kampala: ["Central", "Nakawa", "Kawempe", "Rubaga", "Makindye", "Namanve Industrial Park"],
  },
  Kenya: {
    Nairobi: ["CBD", "Industrial Area", "Embakasi", "Westlands", "ICD Nairobi"],
    Mombasa: ["Kilindini Port", "Changamwe", "Nyali", "Likoni", "Mombasa CBD"],
  },
  Tanzania: {
    Isaka: ["Isaka Dry Port", "Isaka town"],
    "Dar es Salaam": ["Dar es Salaam Port", "Kurasini", "Ilala", "Kinondoni", "Temeke"],
  },
};

export const COUNTRIES = Object.keys(LOCATION_TREE);

export function citiesIn(country: string): string[] {
  return Object.keys(LOCATION_TREE[country] ?? {});
}

export function areasIn(city: string): string[] {
  for (const cities of Object.values(LOCATION_TREE)) {
    if (cities[city]) return cities[city];
  }
  return [];
}

export function countryOfCity(city: string | null | undefined): string {
  if (!city) return "";
  return COUNTRIES.find((country) => city in LOCATION_TREE[country]) ?? "";
}

/** "Area, City, Country", leaving out what is missing. */
export function formatPlace(parts: { area?: string | null; city?: string | null; country?: string | null }) {
  return [parts.area, parts.city, parts.country || countryOfCity(parts.city)].filter(Boolean).join(", ");
}

/** A booking's pickup and destination as full addresses, falling back to the city for older bookings. */
export function bookingPlaces(booking: {
  pickupLocation: string;
  destination: string;
  pickupArea?: string | null;
  pickupCity?: string | null;
  pickupCountry?: string | null;
  destinationArea?: string | null;
  destinationCity?: string | null;
  destinationCountry?: string | null;
}) {
  return {
    pickup: formatPlace({ area: booking.pickupArea, city: booking.pickupCity ?? booking.pickupLocation, country: booking.pickupCountry }),
    destination: formatPlace({ area: booking.destinationArea, city: booking.destinationCity ?? booking.destination, country: booking.destinationCountry }),
  };
}
