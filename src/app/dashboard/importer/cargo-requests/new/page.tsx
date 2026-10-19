"use client";

import { BackLink } from "@/components/common/layout-blocks";
import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { CargoRequestForm } from "@/features/cargo/cargo-request-form";

export default function NewCargoRequestPage() {
  return (
    <RoleShell role="IMPORTER">
      <BackLink href="/dashboard/importer/cargo-requests">Cargo requests</BackLink>
      <div className="mt-4">
        <PageHeader eyebrow="Shipping" title="New cargo request" subtitle="Tell truck owners what you need moved. Publishing sends no money anywhere: owners reply with quotations first." />
      </div>
      <div className="mt-6">
        <CargoRequestForm />
      </div>
    </RoleShell>
  );
}
