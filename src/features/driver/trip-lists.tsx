"use client";

import { BookingBadge } from "@/components/status-badge";
import { formatDate } from "@/components/ui";
import { EmptyNote, Panel } from "@/features/importer-dashboard/kit";
import { bookingPlaces } from "@/lib/locations";
import type { Booking } from "@/lib/types";

function TripRow({ booking }: { booking: Booking }) {
  const places = bookingPlaces(booking);
  return (
    <li className="flex items-start gap-3 py-3">
      <div className="w-14 shrink-0 rounded-xl bg-brand-soft py-1.5 text-center text-brand-dark">
        <p className="text-lg font-semibold leading-none tabular-nums">{new Date(booking.pickupDate).getUTCDate()}</p>
        <p className="mt-0.5 text-[11px] font-semibold uppercase">{new Date(booking.pickupDate).toLocaleDateString("en", { month: "short", timeZone: "UTC" })}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-navy">{places.pickup} → {places.destination}</p>
        <p className="text-xs text-muted">
          {formatDate(booking.pickupDate)} – {formatDate(booking.expectedDeliveryDate)} · {booking.cargoType}, {booking.cargoWeight} t
        </p>
      </div>
      <BookingBadge status={booking.status} />
    </li>
  );
}

/** The truck's calendar ahead, in date order (requests the owner has not answered included). */
export function UpcomingTrips({ bookings }: { bookings: Booking[] }) {
  return (
    <Panel title="Coming up" subtitle="Booked days on your truck's calendar.">
      {bookings.length === 0 ? (
        <EmptyNote title="Nothing booked ahead" text="New trips appear here as soon as the owner accepts them." />
      ) : (
        <ul className="stagger divide-y divide-line">
          {bookings.map((booking) => <TripRow key={booking.id} booking={booking} />)}
        </ul>
      )}
    </Panel>
  );
}

export function TripHistory({ bookings }: { bookings: Booking[] }) {
  return (
    <Panel title="Trip history" subtitle="Delivered, completed and cancelled trips.">
      {bookings.length === 0 ? (
        <EmptyNote title="No past trips" text="Finished trips are kept here." />
      ) : (
        <ul className="divide-y divide-line">
          {bookings.slice(0, 10).map((booking) => <TripRow key={booking.id} booking={booking} />)}
        </ul>
      )}
    </Panel>
  );
}
