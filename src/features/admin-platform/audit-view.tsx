"use client";

import { QueryBoundary } from "@/components/common/async-state";
import { DataTable, PageHeader } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDateTime } from "@/lib/format";
import { services } from "@/services";

export function AuditView() {
  const actor = useActor();
  const query = useServiceQuery(() => services.admin.listAudit(actor!, { pageSize: 5000 }), [actor?.id]);
  return (
    <>
      <PageHeader eyebrow="Accountability" title="Audit logs" subtitle="A record of sensitive actions. Search by person, action or reference, and filter by the type of record." />
      <div className="mt-6">
        <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0} empty={{ title: "No audit entries yet", text: "Actions such as decisions, approvals and settings changes are recorded here." }}>
          {(data) => (
            <>
              <p className="mb-3 text-sm text-muted">{data.total} entries, newest first.</p>
              <DataTable
                columns={[{ label: "When" }, { label: "Who" }, { label: "Action" }, { label: "Record" }, { label: "Detail" }]}
                emptyMessage="No entries match your search."
                filterLabel="All record types"
                exportName="ibanga-audit-log"
                rows={data.items.map((entry) => ({
                  id: entry.id,
                  searchText: `${entry.actorName} ${entry.action} ${entry.entityType} ${entry.entityRef} ${entry.detail}`,
                  filterValue: entry.entityType,
                  exportValues: [formatDateTime(entry.at), entry.actorName, entry.action, `${entry.entityType} ${entry.entityRef}`, entry.detail],
                  cells: [
                    <span key="w" className="whitespace-nowrap">{formatDateTime(entry.at)}</span>,
                    entry.actorName,
                    <strong key="a">{entry.action}</strong>,
                    <span key="r"><span className="block">{entry.entityType}</span><span className="text-xs text-muted">{entry.entityRef}</span></span>,
                    <span key="d" className="block max-w-sm whitespace-normal break-words text-muted">{entry.detail || "—"}</span>,
                  ],
                }))}
              />
            </>
          )}
        </QueryBoundary>
      </div>
    </>
  );
}
