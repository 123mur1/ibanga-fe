/** Demonstration cargo requests and quotations. SAMPLE DATA. */
import type { CargoCategory, CargoRequest, CargoRequestStatus, CargoStop, HandlingFlag, Quotation, QuotationStatus } from "@/types/ops";
import { at, day, ref } from "./helpers";

const stop = (location: string, address: string, contactName: string, contactPhone: string, date: string): CargoStop => ({
  location, address, contactName, contactPhone, date,
});

type RequestInput = Partial<CargoRequest> & {
  n: number;
  importerId: string;
  title: string;
  category: CargoCategory;
  pickup: CargoStop;
  delivery: CargoStop;
  weightTons: number;
  truckType: string;
  status: CargoRequestStatus;
  created: number;
  flags?: HandlingFlag[];
};

function request(input: RequestInput): CargoRequest {
  const { n, created, ...rest } = input;
  const volume = Math.round(input.weightTons * 2.4);
  return {
    id: `cr${n}`,
    ref: ref("CR", n),
    description: `${input.title}. Goods are packed and ready for collection.`,
    volumeM3: volume,
    lengthM: 6 + (n % 4),
    widthM: 2.2,
    heightM: 2.3,
    minCapacityTons: Math.ceil(input.weightTons),
    valueRwf: input.weightTons * 4_200_000,
    flags: [],
    loadingRequirements: "Forklift available at the pickup site during working hours.",
    unloadingRequirements: "Two loaders at the destination. Gate pass will be shared before arrival.",
    instructions: "Call the site contact 1 hour before arrival.",
    photos: [],
    documentNames: ["Packing list.pdf", "Commercial invoice.pdf"],
    createdAt: at(created, 8, 30),
    updatedAt: at(created, 8, 30),
    ...rest,
  };
}

export const cargoRequests: CargoRequest[] = [
  request({
    n: 1, importerId: "u-importer", title: "Building materials to Nairobi", category: "BUILDING_MATERIALS",
    pickup: stop("Kigali", "KG 7 Ave, Gikondo industrial zone", "Alice Mukamana", "+250 788 441 301", day(6)),
    delivery: stop("Nairobi", "Industrial Area, Enterprise Road", "Peter Kamau", "+254 722 118 440", day(10)),
    weightTons: 18, truckType: "Semi-trailer", budgetRwf: 1_650_000, status: "OPEN", created: -2,
  }),
  request({
    n: 2, importerId: "u-importer", title: "Washed coffee bags for export", category: "AGRICULTURE",
    pickup: stop("Huye", "Butare coffee washing station", "Jean Bosco Ntawukuriryayo", "+250 786 552 018", day(5)),
    delivery: stop("Mombasa", "Kipevu terminal, gate 3", "Rashid Mwangi", "+254 733 901 220", day(11)),
    weightTons: 12, truckType: "Box truck", budgetRwf: 1_000_000, status: "QUOTED", created: -4,
    flags: ["SPECIAL_HANDLING"], instructions: "Keep dry. Strap bags to prevent shifting.",
  }),
  request({
    n: 3, importerId: "u-importer-3", title: "Retail stock to Kampala", category: "RETAIL_GOODS",
    pickup: stop("Kigali", "Nyabugogo market logistics yard", "Maya Niyonzima", "+250 788 330 441", day(9)),
    delivery: stop("Kampala", "Kikuubo warehouse 12", "Joseph Ssemakula", "+256 772 440 110", day(12)),
    weightTons: 8, truckType: "Box truck", status: "DRAFT", created: -1,
  }),
  request({
    n: 4, importerId: "u-importer-2", title: "Excavator spare parts to Kigali", category: "MACHINERY",
    pickup: stop("Kampala", "Namanve industrial park, plot 18", "David Okello", "+256 772 118 904", day(4)),
    delivery: stop("Kigali", "Masoro heavy equipment yard", "Eugène Habimana", "+250 788 120 774", day(8)),
    weightTons: 13, truckType: "Flatbed", budgetRwf: 1_450_000, status: "QUOTED", created: -5,
    flags: ["SPECIAL_HANDLING"], instructions: "Strap and tarpaulin cover required. No stacking.",
  }),
  request({
    n: 5, importerId: "u-importer", title: "Chilled avocados for export packing", category: "PERISHABLES",
    pickup: stop("Musanze", "Musanze packing house", "Marie Claire Uwase", "+250 788 441 220", "2026-10-06"),
    delivery: stop("Kampala", "Nakawa cold store", "Sarah Namubiru", "+256 701 330 214", "2026-10-10"),
    weightTons: 12, truckType: "Refrigerated", budgetRwf: 900_000, status: "BOOKED", created: -17,
    flags: ["PERISHABLE", "FRAGILE"], instructions: "Keep between 4 and 6 degrees Celsius.",
    bookingId: "b2", acceptedQuotationId: "q6",
  }),
  request({
    n: 6, importerId: "u-importer", title: "Generator and spare parts from Mombasa", category: "MACHINERY",
    pickup: stop("Mombasa", "Kilindini harbour, shed 4", "Hassan Ali", "+254 722 556 018", "2026-08-20"),
    delivery: stop("Kigali", "Special Economic Zone, Masoro", "Jeanine Uwase", "+250 788 441 220", "2026-08-24"),
    weightTons: 9, truckType: "Flatbed", budgetRwf: 1_500_000, status: "BOOKED", created: -62,
    flags: ["SPECIAL_HANDLING"], bookingId: "b4", acceptedQuotationId: "q7",
  }),
  request({
    n: 7, importerId: "u-importer-2", title: "Retail stock from Nairobi", category: "RETAIL_GOODS",
    pickup: stop("Nairobi", "Gate pass under Okello Cargo, Embakasi ICD", "Francis Odhiambo", "+254 701 220 881", "2026-09-10"),
    delivery: stop("Kigali", "Nyabugogo logistics park", "David Okello", "+256 772 118 904", "2026-09-13"),
    weightTons: 10, truckType: "Box truck", budgetRwf: 800_000, status: "BOOKED", created: -20,
    bookingId: "b5", acceptedQuotationId: "q8",
  }),
  request({
    n: 8, importerId: "u-importer", title: "Palletised household goods to Mombasa", category: "GENERAL",
    pickup: stop("Kigali", "Kicukiro distribution centre", "Jeanine Uwase", "+250 788 441 220", "2026-10-15"),
    delivery: stop("Mombasa", "Kipevu terminal, gate 3", "Rashid Mwangi", "+254 733 901 220", "2026-10-21"),
    weightTons: 11, truckType: "Container", budgetRwf: 520_000, status: "BOOKED", created: -7,
    instructions: "Keep dry. Delivery to Kipevu terminal gate 3.", bookingId: "b6", acceptedQuotationId: "q9",
  }),
  request({
    n: 9, importerId: "u-importer-2", title: "Chilled dairy products to Kigali", category: "PERISHABLES",
    pickup: stop("Kampala", "Kawempe dairy depot", "Grace Nakato", "+256 700 118 330", day(7)),
    delivery: stop("Kigali", "Remera cold chain hub", "Eugène Habimana", "+250 788 120 774", day(10)),
    weightTons: 14, truckType: "Refrigerated", budgetRwf: 1_100_000, status: "OPEN", created: -1,
    flags: ["PERISHABLE"], instructions: "Maintain 2 to 4 degrees Celsius for the whole journey.",
  }),
  request({
    n: 10, importerId: "u-importer-3", title: "Fertiliser bags to Rusumo", category: "AGRICULTURE",
    pickup: stop("Kigali", "Gikondo store 5", "Maya Niyonzima", "+250 788 330 441", day(-3)),
    delivery: stop("Rusumo", "Rusumo one-stop border post", "Innocent Ndayambaje", "+250 788 004 410", day(-1)),
    weightTons: 16, truckType: "Semi-trailer", status: "CANCELLED", created: -10,
    cancelledReason: "Supplier postponed the shipment to next month.",
  }),
  request({
    n: 11, importerId: "u-importer", title: "Industrial lubricants in drums", category: "FUEL_CHEMICALS",
    pickup: stop("Kigali", "Masoro fuel depot", "Alice Mukamana", "+250 788 441 301", day(8)),
    delivery: stop("Dar es Salaam", "Kurasini oil terminal", "Said Mrisho", "+255 713 440 220", day(14)),
    weightTons: 20, truckType: "Tanker", budgetRwf: 1_400_000, status: "OPEN", created: 0,
    flags: ["HAZARDOUS"], instructions: "Dangerous-goods certified driver required. Safety data sheets attached.",
  }),
  request({
    n: 12, importerId: "u-importer-2", title: "Packaged beverages to Kigali", category: "RETAIL_GOODS",
    pickup: stop("Kampala", "Ntinda beverage plant", "Grace Nakato", "+256 700 118 330", day(-12)),
    delivery: stop("Kigali", "Kimironko depot", "Eugène Habimana", "+250 788 120 774", day(-9)),
    weightTons: 10, truckType: "Box truck", status: "EXPIRED", created: -25,
  }),
];

function quote(
  n: number,
  cargoRequestId: string,
  ownerId: string,
  truckId: string,
  driverId: string | undefined,
  amountRwf: number,
  status: QuotationStatus,
  created: number,
  pickup: string,
  delivery: string,
  notes: string,
): Quotation {
  return {
    id: `q${n}`,
    ref: ref("QT", n),
    cargoRequestId,
    ownerId,
    truckId,
    driverId,
    amountRwf,
    estimatedPickupDate: pickup,
    estimatedDeliveryDate: delivery,
    notes,
    validUntil: at(created + 7, 17),
    status,
    createdAt: at(created, 10, 15),
    respondedAt: status === "SUBMITTED" ? undefined : at(created + 1, 9),
  };
}

export const quotations: Quotation[] = [
  quote(1, "cr2", "u-owner", "truck-u-owner-4", "d2", 780_000, "SUBMITTED", -3, day(5), day(10), "Enclosed box body, strapped load, driver with 61 regional trips."),
  quote(2, "cr2", "u-owner-2", "t3", "d6", 940_000, "SUBMITTED", -3, day(5), day(10), "Flatbed with full tarpaulin cover. Departure from Huye the same day."),
  quote(3, "cr2", "u-owner", "truck-u-owner-3", "d1", 820_000, "SUBMITTED", -2, day(6), day(11), "Flatbed with tarpaulin and edge protection."),
  quote(4, "cr4", "u-owner-2", "t3", "d6", 1_380_000, "SUBMITTED", -4, day(4), day(8), "Heavy-duty flatbed, 30t rated, certified straps."),
  quote(5, "cr4", "u-owner", "truck-u-owner-3", "d1", 1_250_000, "SUBMITTED", -4, day(5), day(9), "Flatbed available from Namanve on request date."),
  quote(6, "cr5", "u-owner-2", "t2", "d5", 850_000, "ACCEPTED", -16, "2026-10-06", "2026-10-10", "Reefer pre-cooled to 4 degrees before loading."),
  quote(7, "cr6", "u-owner-2", "t3", "d6", 1_400_000, "ACCEPTED", -61, "2026-08-20", "2026-08-24", "Heavy-duty flatbed, lifting straps supplied."),
  quote(8, "cr7", "u-owner", "t4", "d2", 740_000, "ACCEPTED", -19, "2026-09-10", "2026-09-13", "Secure box truck with seal numbers recorded."),
  quote(9, "cr8", "u-owner", "truck-u-owner-1", "d1", 460_000, "ACCEPTED", -6, "2026-10-15", "2026-10-21", "40ft container carrier, weather-proof."),
  quote(10, "cr5", "u-owner", "truck-u-owner-2", undefined, 910_000, "REJECTED", -16, "2026-10-06", "2026-10-11", "Reefer available, slightly later departure."),
  quote(11, "cr8", "u-owner-2", "t3", "d6", 540_000, "REJECTED", -6, "2026-10-16", "2026-10-22", "Flatbed with tarpaulin."),
  quote(12, "cr1", "u-owner-2", "t3", "d6", 1_700_000, "WITHDRAWN", -1, day(6), day(11), "Withdrawn: truck reassigned to another booking."),
];
