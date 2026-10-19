/**
 * Pure data functions that keep derived records consistent. Run inside every database update
 * (see `commit` in `util.ts`), so settlement eligibility always reflects bookings, shipments,
 * disputes and incidents. A real backend would do the equivalent inside its transactions.
 */
import { evaluateSettlement, netPayable } from "@/config/business-rules";
import { paymentShares } from "@/lib/payments";
import type { Booking } from "@/lib/types";
import type { OpsData, Settlement, Shipment, ShipmentMilestone, ShipmentStatus } from "@/types/ops";
import { getDirectory } from "./directory";

const TERMINAL = ["PROCESSING", "PAID", "FAILED", "REVERSED"];
const ADMIN_HOLD = "Admin hold";

export function openDisputeFor(data: OpsData, bookingId: string): boolean {
  return data.disputeCases.some((item) => item.bookingId === bookingId && !["RESOLVED", "REJECTED"].includes(item.status));
}

export function openIncidentFor(data: OpsData, shipmentId: string | undefined): boolean {
  return Boolean(shipmentId) && data.incidents.some((item) => item.shipmentId === shipmentId && !["RESOLVED", "CLOSED"].includes(item.status));
}

/** Re-evaluate stored settlement statuses. Terminal and admin-held settlements are never touched. */
export function recomputeSettlements(data: OpsData): OpsData {
  const { bookings } = getDirectory();
  if (!bookings.length) return data;
  let changed = false;
  const settlements = data.settlements.map((settlement) => {
    if (TERMINAL.includes(settlement.status) || settlement.holdReason?.startsWith(ADMIN_HOLD)) return settlement;
    const booking = bookings.find((item) => item.id === settlement.bookingId);
    if (!booking) return settlement;
    const shipment = data.shipments.find((item) => item.bookingId === settlement.bookingId);
    const result = evaluateSettlement({
      booking,
      shipment,
      openDispute: openDisputeFor(data, booking.id),
      openIncident: openIncidentFor(data, shipment?.id),
    });
    const holdReason = result.status === "ON_HOLD" ? result.reasons[0] : undefined;
    if (result.status === settlement.status && holdReason === settlement.holdReason) return settlement;
    changed = true;
    return {
      ...settlement,
      status: result.status,
      holdReason,
      history: [...settlement.history, { at: new Date().toISOString(), status: result.status, actor: "System", note: result.reasons[0] }],
    };
  });
  // Keep each shipment's visible hold in step with open disputes and incidents.
  const shipments = data.shipments.map((shipment) => {
    const hold = openDisputeFor(data, shipment.bookingId)
      ? "An open dispute holds this settlement."
      : openIncidentFor(data, shipment.id)
        ? "An unresolved incident holds this settlement."
        : undefined;
    if (hold === shipment.settlementHold) return shipment;
    if (hold && shipment.settlementHold) return shipment;
    changed = true;
    return { ...shipment, settlementHold: hold };
  });
  return changed ? { ...data, settlements, shipments } : data;
}

const STATUS_FROM_BOOKING: Partial<Record<Booking["status"], ShipmentStatus>> = {
  ACCEPTED: "SCHEDULED",
  IN_PROGRESS: "IN_TRANSIT",
  DELIVERED: "ARRIVED",
};

function milestonesFor(booking: Booking, status: ShipmentStatus): ShipmentMilestone[] {
  if (status === "SCHEDULED") return [];
  const start = new Date(booking.pickupDate).getTime();
  const make = (index: number, kind: ShipmentMilestone["kind"], place: string, note: string): ShipmentMilestone => ({
    id: `${booking.id}-auto-${index}`,
    kind,
    at: new Date(start + index * 2 * 3_600_000).toISOString(),
    place,
    note,
    recordedBy: "system",
    simulated: true,
  });
  const base = [
    make(0, "PICKUP_CONFIRMED", booking.pickupLocation, "Pickup confirmed."),
    make(1, "LOADED", booking.pickupLocation, "Cargo loaded."),
    make(2, "DEPARTED", booking.pickupLocation, "Departed."),
  ];
  return status === "ARRIVED" ? [...base, make(3, "ARRIVED", booking.destination, "Arrived. Delivery evidence has not been submitted.")] : base;
}

/**
 * Create shipments (and settlements) for marketplace bookings that do not have them yet, so a
 * booking moved forward from any screen still appears in shipment and settlement lists.
 */
export function ensureRecords(data: OpsData, bookings: Booking[]): OpsData {
  const { trucks } = getDirectory();
  const newShipments: Shipment[] = [];
  const known = new Set(data.shipments.map((item) => item.bookingId));
  for (const booking of bookings) {
    const status = STATUS_FROM_BOOKING[booking.status];
    if (!status || known.has(booking.id)) continue;
    const truck = trucks.find((item) => item.id === booking.truckId);
    if (!truck) continue;
    newShipments.push({
      id: `sh-${booking.id}`,
      ref: `SHP-${new Date().getFullYear()}-${String(data.shipments.length + newShipments.length + 1).padStart(4, "0")}`,
      bookingId: booking.id,
      cargoRequestId: booking.cargoRequestId,
      ownerId: truck.ownerId,
      importerId: booking.importerId,
      truckId: truck.id,
      driverId: booking.driverId,
      status,
      etaDate: booking.expectedDeliveryDate,
      milestones: milestonesFor(booking, status),
      createdAt: booking.createdAt,
    });
  }
  const shipments = newShipments.length ? [...newShipments, ...data.shipments] : data.shipments;

  const haveSettlement = new Set(data.settlements.map((item) => item.bookingId));
  const newSettlements: Settlement[] = [];
  for (const shipment of shipments) {
    if (haveSettlement.has(shipment.bookingId)) continue;
    const booking = bookings.find((item) => item.id === shipment.bookingId);
    const amount = booking?.agreedPriceRwf ?? booking?.payment?.amountRwf;
    if (!booking || !amount || !booking.payment || !["FUNDED", "HELD", "RELEASED"].includes(booking.payment.status)) continue;
    const shares = paymentShares(amount);
    newSettlements.push({
      id: `st-${booking.id}`,
      ref: `STL-${new Date().getFullYear()}-${String(data.settlements.length + newSettlements.length + 1).padStart(4, "0")}`,
      bookingId: booking.id,
      shipmentId: shipment.id,
      ownerId: shipment.ownerId,
      agreedAmountRwf: shares.amountRwf,
      platformFeeRwf: shares.commissionRwf,
      deductionsRwf: 0,
      adjustmentsRwf: 0,
      netAmountRwf: netPayable(shares.amountRwf, shares.commissionRwf, 0, 0),
      status: "AWAITING_DELIVERY",
      history: [{ at: new Date().toISOString(), status: "AWAITING_DELIVERY", actor: "System", note: "Settlement created when the payment was held." }],
      createdAt: new Date().toISOString(),
    });
  }
  if (!newShipments.length && !newSettlements.length) return data;
  return { ...data, shipments, settlements: [...newSettlements, ...data.settlements] };
}
