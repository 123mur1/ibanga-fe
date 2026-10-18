"use client";

import { BookingDetail } from "@/components/booking-detail";

export default function ImporterBookingDetail() {
  return <BookingDetail role="IMPORTER" backHref="/dashboard/importer/bookings" backLabel="My bookings" />;
}
