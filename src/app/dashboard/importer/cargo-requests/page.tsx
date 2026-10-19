"use client";

import { QueryBoundary } from "@/components/common/async-state";
import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { LinkButton } from "@/features/importer/link-button";
import { CargoRequestTable } from "@/features/cargo/cargo-request-table";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { services } from "@/services";

const newRequest = <LinkButton href="/dashboard/importer/cargo-requests/new">New request</LinkButton>;

export default function ImporterCargoRequestsPage() {
  const actor = useActor();
  const query = useServiceQuery(() => services.cargoRequests.list(actor!, { pageSize: 500 }), [actor?.id]);

  return (
    <RoleShell role="IMPORTER">
      <PageHeader
        eyebrow="Shipping"
        title="Cargo requests"
        subtitle="Describe what you need moved. Truck owners reply with quotations, and you choose one. A quotation is not a booking."
        actions={
          <>
            <LinkButton href="/#available-trucks" variant="ghost">Find trucks instead</LinkButton>
            {newRequest}
          </>
        }
      />
      <div className="mt-6">
        <QueryBoundary
          query={query}
          isEmpty={(data) => data.items.length === 0}
          empty={{ title: "No cargo requests yet", text: "Publish a request and available trucks will send you quotations to compare.", action: newRequest }}
        >
          {(data) => <CargoRequestTable requests={data.items} />}
        </QueryBoundary>
      </div>
    </RoleShell>
  );
}
