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
      className="group flex flex-col gap-2 rounded-2xl border border-line bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-card sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="font-semibold text-navy">
          {booking.cargoType} · {booking.pickupLocation} → {booking.destination}
        </p>
        <p className="text-sm text-muted">
          {truck ? `${truck.plateNumber} · ${truck.truckType}` : booking.truckId}{" "}
          · pickup {formatDate(booking.pickupDate)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <BookingBadge status={booking.status} />
        <svg
          className="shrink-0 text-muted/50 transition group-hover:translate-x-0.5 group-hover:text-brand"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m9 5 7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
