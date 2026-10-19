"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { BackLink, Section } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { RoleShell } from "@/components/common/role-shell";
import { StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/ui";
import { BookedPanel, CancelRequestPanel, CargoRequestDetails, CargoRequestHistory } from "@/features/cargo/cargo-request-view";
import { QuotationComparison } from "@/features/cargo/quotation-comparison";
import { LinkButton } from "@/features/importer/link-button";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { services } from "@/services";

export default function CargoRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const actor = useActor();
  const [justBooked, setJustBooked] = useState<string | null>(null);
  const query = useServiceQuery(
    async () => {
      const request = await services.cargoRequests.get(actor!, id);
      const quotations = await services.quotations.listForRequest(actor!, id);
      return { request, quotations };
    },
    [actor?.id, id],
  );

  return (
    <RoleShell role="IMPORTER">
      <BackLink href="/dashboard/importer/cargo-requests">Cargo requests</BackLink>
      <div className="mt-4">
        <QueryBoundary query={query}>
          {({ request, quotations }) => {
            const bookingId = justBooked ?? request.bookingId;
            const editable = ["DRAFT", "OPEN"].includes(request.status) && !quotations.some((quote) => ["SUBMITTED", "ACCEPTED"].includes(quote.status));
            const cancellable = ["DRAFT", "OPEN", "QUOTED"].includes(request.status);
            return (
              <div className="space-y-5">
                <PageHeader
                  eyebrow={request.ref}
                  title={request.title}
                  subtitle={`${request.pickup.location || "—"} to ${request.delivery.location || "—"}`}
                  actions={
                    <>
                      <StatusBadge family="cargoRequest" status={request.status} />
                      {editable ? <LinkButton href={`/dashboard/importer/cargo-requests/${request.id}/edit`} variant="ghost">Edit</LinkButton> : null}
                    </>
                  }
                />
                {request.status === "DRAFT" ? (
                  <Notice tone="info" title="This is a draft" action={{ href: `/dashboard/importer/cargo-requests/${request.id}/edit`, label: "Finish and publish" }}>
                    Truck owners cannot see it yet. Complete the details and publish to receive quotations.
                  </Notice>
                ) : null}
                {request.status === "CANCELLED" ? <Notice tone="warning" title="Request cancelled">{request.cancelledReason ?? "No reason recorded."}</Notice> : null}
                {request.status === "EXPIRED" ? <Notice tone="warning" title="Request expired">No quotation was accepted in time. Create a new request to try again.</Notice> : null}
                {bookingId ? <BookedPanel bookingId={bookingId} /> : null}

                {request.status !== "DRAFT" ? (
                  <Section
                    title="Quotations"
                    description="Compare offers, then review one before accepting."
                    actions={<LinkButton href="/#available-trucks" variant="ghost">Find trucks instead</LinkButton>}
                  >
                    <QuotationComparison request={request} quotations={quotations} onBooked={setJustBooked} />
                  </Section>
                ) : null}

                <CargoRequestDetails request={request} />
                <Section title="Request history"><CargoRequestHistory request={request} quotations={quotations} /></Section>
                {cancellable ? <CancelRequestPanel request={request} /> : null}
              </div>
            );
          }}
        </QueryBoundary>
      </div>
    </RoleShell>
  );
}
