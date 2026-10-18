"use client";

import { BookingDetail } from "@/components/booking-detail";

export default function OwnerBookingDetail() {
  return <BookingDetail role="TRUCK_OWNER" backHref="/dashboard/owner/bookings" backLabel="All bookings" />;
}
