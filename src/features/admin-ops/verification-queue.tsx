"use client";

import { QueryBoundary } from "@/components/common/async-state";
import { SimulationNotice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { StatGrid } from "@/components/common/layout-blocks";
import { DataTable, StatCard, ViewLink } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate, titleCase } from "@/lib/format";
import { services } from "@/services";
import { useAdminLookups } from "./use-admin";

export function VerificationQueue() {
  const actor = useActor();
  const { subject, userName } = useAdminLookups();
  const query = useServiceQuery(() => services.documents.listVerifications(actor!, { pageSize: 500 }), [actor?.id]);

  return (
    <div className="mt-6 space-y-5">
      <SimulationNotice kind="verification" />
      <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0} empty={{ title: "No verification requests", text: "Requests appear when owners, drivers or importers submit documents." }}>
        {(data) => {
          const count = (status: string) => data.items.filter((item) => item.status === status).length;
          // Pending first, then newest first.
          const items = [...data.items].sort((a, b) => Number(b.status === "PENDING") - Number(a.status === "PENDING") || b.submittedAt.localeCompare(a.submittedAt));
          return (
            <>
              <StatGrid>
                <StatCard label="Pending review" value={count("PENDING")} hint="Needs a decision" accent="warn" />
                <StatCard label="Approved" value={count("APPROVED")} hint="Verified" accent="good" />
                <StatCard label="Rejected" value={count("REJECTED")} hint="Sent back" accent="bad" />
                <StatCard label="All requests" value={data.total} hint="Every kind" />
              </StatGrid>
              <DataTable
                columns={[{ label: "Request" }, { label: "Applicant" }, { label: "Requested by" }, { label: "Documents" }, { label: "Submitted" }, { label: "Status" }, { label: "Actions", className: "text-right" }]}
                filterLabel="All statuses"
                extraFilterLabel="All kinds"
                exportName="ibanga-verification-requests"
                emptyMessage="No requests match."
                rows={items.map((item) => {
                  const who = subject(item.subjectKind, item.subjectId);
                  return {
                    id: item.id,
                    searchText: `${item.ref} ${item.kind} ${who.label} ${userName(item.requesterId)} ${item.status}`,
                    filterValue: item.status,
                    extraFilterValue: item.kind,
                    exportValues: [item.ref, item.kind, who.label, userName(item.requesterId), String(item.documentIds.length), formatDate(item.submittedAt), item.status, ""],
                    cells: [
                      <span key="ref"><strong className="block">{item.ref}</strong><span className="text-xs text-muted">{titleCase(item.kind)}</span></span>,
                      <span key="who"><strong className="block">{who.label}</strong><span className="text-xs text-muted">{titleCase(item.subjectKind)}</span></span>,
                      userName(item.requesterId),
                      item.documentIds.length,
                      formatDate(item.submittedAt),
                      <StatusBadge key="status" family="verification" status={item.status} />,
                      <div key="action" className="flex justify-end"><ViewLink href={`/dashboard/admin/verifications/${item.id}`} label={`Review ${item.ref}`} /></div>,
                    ],
                  };
                })}
              />
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
