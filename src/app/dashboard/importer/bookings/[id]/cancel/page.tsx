"use client";

import { useParams } from "next/navigation";
import { QueryBoundary } from "@/components/common/async-state";
import { BackLink } from "@/components/common/layout-blocks";
import { RoleShell } from "@/components/common/role-shell";
import { PageHeader, EmptyState } from "@/components/ui";
import { CancelBookingPanel } from "@/features/importer/cancel-booking";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";

export default function CancelBookingPage() {
  const { id } = useParams<{ id: string }>();
  const actor = useActor();
  const { bookings } = useIbanga();
  // Only the importer's own booking is ever shown.
  const booking = bookings.find((item) => item.id === id && item.importerId === actor?.id);
  const query = useServiceQuery(
    async () => {
      const [shipment, cancellations] = await Promise.all([
        services.shipments.getByBooking(actor!, id),
        services.cancellations.list(actor!, { pageSize: 200, filters: {} }),
      ]);
      return { shipment, existing: cancellations.items.find((item) => item.bookingId === id && ["REQUESTED", "APPROVED"].includes(item.status)) };
    },
    [actor?.id, id],
  );

  return (
    <RoleShell role="IMPORTER">
      <BackLink href={`/dashboard/importer/bookings/${id}`}>Back to booking</BackLink>
      <div className="mt-4">
        <PageHeader eyebrow="Booking" title="Cancel booking" subtitle="See exactly what cancelling costs before you ask. Nothing is cancelled until you confirm." />
      </div>
      <div className="mt-6">
        {!booking ? (
          <EmptyState title="Booking not found" text="This booking does not exist or is not yours." />
        ) : (
          <QueryBoundary query={query}>
            {({ shipment, existing }) => <CancelBookingPanel booking={booking} shipment={shipment} existing={existing} />}
          </QueryBoundary>
        )}
      </div>
    </RoleShell>
  );
}
