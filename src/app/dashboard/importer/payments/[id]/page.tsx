"use client";

import { PaymentDetail } from "@/components/payment-detail";

export default function ImporterPaymentDetailPage() {
  return <PaymentDetail role="IMPORTER" backHref="/dashboard/importer/payments" backLabel="My payments" />;
}
