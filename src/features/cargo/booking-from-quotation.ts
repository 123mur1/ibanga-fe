import { formatRwf } from "@/lib/payments";
import type { Booking } from "@/lib/types";
import type { CargoRequest, Quotation } from "@/types/ops";

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

/**
 * Builds the booking that results from accepting a quotation. The booking starts as
 * ACCEPTED (confirmed, awaiting payment): a quotation is not a payment, so `payment` stays null
 * until the importer pays. A real backend creates this inside the accept-quotation transaction.
 */
export function bookingFromQuotation(request: CargoRequest, quotation: Quotation): Booking {
  return {
    id: `booking-${Date.now().toString(36)}`,
    truckId: quotation.truckId,
    importerId: request.importerId,
    cargoType: CATEGORY_LABEL[request.category],
    cargoDescription: request.description,
    cargoWeight: `${request.weightTons} tons`,
    pickupLocation: request.pickup.location,
    destination: request.delivery.location,
    pickupDate: quotation.estimatedPickupDate,
    expectedDeliveryDate: quotation.estimatedDeliveryDate,
    additionalInstructions: request.instructions,
    agreedPrice: formatRwf(quotation.amountRwf),
    agreedPriceRwf: quotation.amountRwf,
    payment: null,
    status: "ACCEPTED",
    createdAt: new Date().toISOString(),
    cargoRequestId: request.id,
    quotationId: quotation.id,
    driverId: quotation.driverId,
  };
}

export { CATEGORY_LABEL };
