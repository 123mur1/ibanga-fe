import { evaluateSettlement, type SettlementEvaluation } from "@/config/business-rules";
import { useOps } from "@/hooks/use-ops";
import { useIbanga } from "@/lib/store";
import type { Settlement } from "@/types/ops";

/** Explains why a settlement is (not) eligible, using the central rule with the live booking, shipment, dispute and incident. */
export function useEligibility() {
  const { bookings } = useIbanga();
  const { shipments, disputeCases, incidents } = useOps();
  return (settlement: Settlement): SettlementEvaluation | undefined => {
    const booking = bookings.find((item) => item.id === settlement.bookingId);
    if (!booking) return undefined;
    const shipment = shipments.find((item) => item.bookingId === booking.id);
    return evaluateSettlement({
      booking,
      shipment,
      openDispute: disputeCases.some((item) => item.bookingId === booking.id && !["RESOLVED", "REJECTED"].includes(item.status)),
      openIncident: Boolean(shipment) && incidents.some((item) => item.shipmentId === shipment?.id && !["RESOLVED", "CLOSED"].includes(item.status)),
    });
  };
}
