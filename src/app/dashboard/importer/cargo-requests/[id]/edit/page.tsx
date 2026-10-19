"use client";

import { useParams } from "next/navigation";
import { QueryBoundary } from "@/components/common/async-state";
import { BackLink } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";
import { CargoRequestForm } from "@/features/cargo/cargo-request-form";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { services } from "@/services";

export default function EditCargoRequestPage() {
  const { id } = useParams<{ id: string }>();
  const actor = useActor();
  const query = useServiceQuery(
    async () => {
      const request = await services.cargoRequests.get(actor!, id);
      const quotes = await services.quotations.listForRequest(actor!, id);
      return { request, quoted: quotes.some((quote) => ["SUBMITTED", "ACCEPTED"].includes(quote.status)) };
    },
    [actor?.id, id],
  );

  return (
    <RoleShell role="IMPORTER">
      <BackLink href={`/dashboard/importer/cargo-requests/${id}`}>Back to request</BackLink>
      <div className="mt-4">
        <PageHeader eyebrow="Shipping" title="Edit cargo request" subtitle="Only drafts and open requests without quotations can be changed." />
      </div>
      <div className="mt-6">
        <QueryBoundary query={query}>
          {({ request, quoted }) =>
            !["DRAFT", "OPEN"].includes(request.status) || quoted ? (
              <Notice tone="warning" title="This request can no longer be edited" action={{ href: `/dashboard/importer/cargo-requests/${id}`, label: "Back to request" }}>
                Quotations already exist or the request is closed. Cancel it and create a new request to change the cargo.
              </Notice>
            ) : (
              <CargoRequestForm existing={request} />
            )
          }
        </QueryBoundary>
      </div>
    </RoleShell>
  );
}
