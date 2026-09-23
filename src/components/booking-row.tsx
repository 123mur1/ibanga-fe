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
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-line bg-card p-4 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-card sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand to-accent opacity-0 transition group-hover:opacity-100" />
      <div className="flex min-w-0 items-start gap-4 sm:items-center">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand transition duration-200 [&_svg]:h-4 [&_svg]:w-4 group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-brand group-hover:text-white sm:mt-0">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M8 10.5h.01M16 10.5h.01M8 14h.01M16 14h.01" />
            <path d="m11 13 1.5-1.5L14 13M12.5 11.5v3" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 font-semibold text-navy">
            {booking.pickupLocation}
            <svg
              className="text-brand"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
            {booking.destination}
          </p>
          <p className="mt-0.5 line-clamp-1 text-sm text-muted">
            {booking.cargoType} · {booking.cargoWeight}
            {truck ? ` · ${truck.plateNumber} · ${truck.truckType}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 pl-15 sm:pl-0">
        <div className="hidden text-right sm:block">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Pickup
          </p>
          <p className="text-sm font-semibold text-navy">
            {formatDate(booking.pickupDate)}
          </p>
        </div>
        <BookingBadge status={booking.status} />
      </div>
    </Link>
  );
}