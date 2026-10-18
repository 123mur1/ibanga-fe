"use client";

import { PaymentDetail } from "@/components/payment-detail";

export default function OwnerPaymentDetailPage() {
  return <PaymentDetail role="TRUCK_OWNER" backHref="/dashboard/owner/payments" backLabel="All payments" />;
}
