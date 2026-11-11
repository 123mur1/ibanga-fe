import type { CargoRequest } from "@/types/ops";

/** How each cargo request category is written on a booking. */
const CATEGORY_LABEL: Record<CargoRequest["category"], string> = {
  GENERAL: "General cargo",
  BUILDING_MATERIALS: "Building materials",
  PERISHABLES: "Perishables",
  MACHINERY: "Machinery",
  FUEL_CHEMICALS: "Fuel and chemicals",
  AGRICULTURE: "Agricultural goods",
  RETAIL_GOODS: "Retail goods",
  OTHER: "Other cargo",
};

export { CATEGORY_LABEL };
