"use client";

import { BookingDetail } from "@/components/booking-detail";

export default function AdminBookingDetailPage() {
  return <BookingDetail role="ADMIN" backHref="/dashboard/admin/bookings" backLabel="All bookings" />;
}
