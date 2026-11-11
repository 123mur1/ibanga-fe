"use client";

import Link from "next/link";
import { TruckThumb } from "@/components/photos";
import { BookingBadge } from "@/components/status-badge";
import { formatDate } from "@/components/ui";
import { bookingPlaces } from "@/lib/locations";
import { formatRwf } from "@/lib/payments";
import type { Booking, Truck } from "@/lib/types";
import { EmptyNote, Icon, Panel, PanelLink, RouteLine, StageProgress } from "./kit";

const ACTIVE = ["PENDING", "ACCEPTED", "IN_PROGRESS", "DELIVERED", "DISPUTED"];

export function ActiveTrips({ bookings, trucks }: { bookings: Booking[]; trucks: Truck[] }) {
  const active = bookings
    .filter((booking) => ACTIVE.includes(booking.status))
    .sort((a, b) => a.pickupDate.localeCompare(b.pickupDate));
  return (
    <Panel title="Your trips in motion" subtitle="Every booking from request to delivery." action={<PanelLink href="/dashboard/tracking">Live map</PanelLink>}>
      {active.length === 0 ? (
        <EmptyNote
          title="No trips yet"
          text="Find a verified truck, choose your dates and send a request. The owner answers, then you pay half to confirm."
          action={
            <Link href="/trucks" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
              <Icon name="search" className="h-4 w-4" /> Find a truck
            </Link>
          }
        />
      ) : (
        <ul className="stagger grid gap-3 md:grid-cols-2">
          {active.slice(0, 6).map((booking) => {
            const truck = trucks.find((item) => item.id === booking.truckId);
            return (
              <li key={booking.id}>
                <Link
                  href={`/dashboard/importer/bookings/${booking.id}`}
                  className="group flex h-full flex-col gap-4 rounded-2xl border border-line bg-background/40 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-card hover:shadow-card"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <TruckThumb photos={truck?.photos ?? []} alt={truck?.plateNumber ?? "Truck"} className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy group-hover:text-brand">{truck ? `${truck.truckType} · ${truck.plateNumber}` : "Booked truck"}</p>
                        <p className="text-xs text-muted">
                          {formatDate(booking.pickupDate)} – {formatDate(booking.expectedDeliveryDate)} · {booking.cargoType}
                        </p>
                      </div>
                    </div>
                    <BookingBadge status={booking.status} />
                  </div>
                  <RouteLine booking={booking} compact />
                  <StageProgress booking={booking} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function RecentBookings({ bookings }: { bookings: Booking[] }) {
  const recent = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  return (
    <Panel title="Recent bookings" action={<PanelLink href="/dashboard/importer/bookings">All bookings</PanelLink>}>
      {recent.length === 0 ? (
        <EmptyNote title="No bookings yet" text="Your requests will be listed here." />
      ) : (
        <ul className="divide-y divide-line">
          {recent.map((booking) => {
            const places = bookingPlaces(booking);
            return (
              <li key={booking.id}>
                <Link href={`/dashboard/importer/bookings/${booking.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition hover:bg-background">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">
                      {booking.pickupCity ?? booking.pickupLocation} → {booking.destinationCity ?? booking.destination}
                    </p>
                    <p className="truncate text-xs text-muted" title={`${places.pickup} → ${places.destination}`}>
                      {formatDate(booking.createdAt)} · {booking.agreedPriceRwf ? formatRwf(booking.agreedPriceRwf) : "Price pending"}
                    </p>
                  </div>
                  <BookingBadge status={booking.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
