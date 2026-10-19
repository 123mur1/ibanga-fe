"use client";

import { ClaimsList } from "@/features/admin-cases/claims-list";
import { AdminPage } from "@/features/admin-platform/admin-page";

export default function AdminInsuranceClaimsPage() {
  return (
    <AdminPage permission="insurance">
      <ClaimsList />
    </AdminPage>
  );
}
