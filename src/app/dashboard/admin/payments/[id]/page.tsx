"use client";

import { PaymentDetail } from "@/components/payment-detail";

export default function AdminPaymentDetailPage() {
  return <PaymentDetail role="ADMIN" backHref="/dashboard/admin/payments" backLabel="All payments" />;
}
