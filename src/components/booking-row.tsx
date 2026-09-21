"use client";

import Link from "next/link";
import { BookingBadge } from "@/components/status-badge";
import { formatDate } from "@/components/ui";
import type { Booking, Truck } from "@/lib/types";

export function BookingRow({
  booking,
  truck,
  href,
}: {
  booking: Booking;
  truck?: Truck;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4 hover:border-navy/20 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="font-semibold text-navy">
          {booking.cargoType} · {booking.pickupLocation} → {booking.destination}
        </p>
        <p className="text-sm text-muted">
          {truck ? `${truck.plateNumber} · ${truck.truckType}` : booking.truckId}{" "}
          · pickup {formatDate(booking.pickupDate)}
        </p>
      </div>
      <BookingBadge status={booking.status} />
    </Link>
  );
}
