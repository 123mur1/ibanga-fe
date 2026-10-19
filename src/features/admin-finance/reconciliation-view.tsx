"use client";

import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { controlClass, FormField } from "@/components/common/form-fields";
import { DetailList, Section, StatGrid } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { StatusBadge } from "@/components/common/status-badge";
import { DataTable, GhostButton, StatCard } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate, formatDateTime, formatRwf } from "@/lib/format";
import { services, type Actor } from "@/services";
import type { ReconciliationRecord, ReconciliationStatus } from "@/types/ops";
import { NoPermissionNotice, NoteAction } from "./finance-parts";
import { useAdminPermission } from "./use-admin-permission";

const STATUSES: ReconciliationStatus[] = ["MATCHED", "UNMATCHED", "PENDING", "DISCREPANCY", "DUPLICATE"];
const diff = (record: ReconciliationRecord) => record.recordedAmountRwf - record.expectedAmountRwf;

export function ReconciliationView() {
  const actor = useActor();
  const canAct = useAdminPermission("reconciliation");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = useServiceQuery(() => services.admin.listReconciliation(actor!, { pageSize: 1000 }), [actor?.id]);

  return (
    <div className="mt-6 space-y-5">
      {!canAct ? <NoPermissionNotice area="reconciliation permissions" /> : null}
      <QueryBoundary query={query} isEmpty={(data) => data.items.length === 0} empty={{ title: "No reconciliation records", text: "Reconciliation records will appear here." }}>
        {(data) => {
          const inRange = data.items.filter((item) => (!from || item.date.slice(0, 10) >= from) && (!to || item.date.slice(0, 10) <= to));
          const selected = data.items.find((item) => item.id === selectedId);
          return (
            <>
              <StatGrid>
                {STATUSES.slice(1).concat("MATCHED").map((status) => {
                  const items = inRange.filter((item) => item.status === status);
                  const amount = status === "DISCREPANCY" ? items.reduce((sum, item) => sum + Math.abs(diff(item)), 0) : items.reduce((sum, item) => sum + item.expectedAmountRwf, 0);
                  return (
                    <StatCard
                      key={status}
                      label={status.charAt(0) + status.slice(1).toLowerCase()}
                      value={items.length}
                      hint={status === "DISCREPANCY" ? `${formatRwf(amount)} difference` : formatRwf(amount)}
                      accent={status === "MATCHED" ? "good" : status === "PENDING" ? "warn" : status === "UNMATCHED" || status === "DISCREPANCY" ? "bad" : "accent"}
                    />
                  );
                })}
              </StatGrid>

              <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-card p-4 shadow-soft">
                <FormField label="From date" className="w-44">
                  <input type="date" className={controlClass} value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} />
                </FormField>
                <FormField label="To date" className="w-44">
                  <input type="date" className={controlClass} value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} />
                </FormField>
                {from || to ? <GhostButton type="button" onClick={() => { setFrom(""); setTo(""); }}>Clear dates</GhostButton> : null}
                <p className="ml-auto text-sm text-muted">{inRange.length} of {data.items.length} records in range. Use the table filters for status and kind.</p>
              </div>

              <DataTable
                columns={[{ label: "Reference" }, { label: "Kind" }, { label: "Provider reference" }, { label: "Expected" }, { label: "Recorded" }, { label: "Difference" }, { label: "Status" }, { label: "Date" }, { label: "Detail" }]}
                rows={inRange.map((item) => ({
                  id: item.id,
                  cells: [
                    <span key="r" className="font-semibold">{item.ref}</span>,
                    item.kind.charAt(0) + item.kind.slice(1).toLowerCase(),
                    <span key="p" className="font-mono text-xs">{item.providerRef}</span>,
                    formatRwf(item.expectedAmountRwf),
                    formatRwf(item.recordedAmountRwf),
                    <span key="d" className={`font-semibold tabular-nums ${diff(item) === 0 ? "text-muted" : "text-bad"}`}>{diff(item) === 0 ? "—" : `${diff(item) > 0 ? "+" : "−"}${formatRwf(Math.abs(diff(item)))}`}</span>,
                    <StatusBadge key="s" family="reconciliation" status={item.status} />,
                    formatDate(item.date),
                    <GhostButton key="o" type="button" onClick={() => setSelectedId(item.id)} aria-label={`Open reconciliation record ${item.ref}`}>Open</GhostButton>,
                  ],
                  searchText: `${item.ref} ${item.providerRef} ${item.bookingId ?? ""} ${item.kind} ${item.status}`,
                  filterValue: item.status,
                  extraFilterValue: item.kind,
                  exportValues: [item.ref, item.kind, item.providerRef, String(item.expectedAmountRwf), String(item.recordedAmountRwf), String(diff(item)), item.status, item.date, item.note ?? ""],
                }))}
                filterLabel="All statuses"
                extraFilterLabel="All kinds"
                exportName="reconciliation-demo"
                emptyMessage="No records match these filters."
              />

              {selected && actor ? <RecordPanel record={selected} actor={actor} canAct={canAct} onClose={() => setSelectedId(null)} /> : null}
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}

function RecordPanel({ record, actor, canAct, onClose }: { record: ReconciliationRecord; actor: Actor; canAct: boolean; onClose: () => void }) {
  const { run, busy } = useAction();
  const difference = diff(record);
  return (
    <Section
      title={`Record ${record.ref}`}
      description="Review the recorded provider amounts and references."
      actions={<GhostButton type="button" onClick={onClose}>Close</GhostButton>}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <DetailList
            items={[
              { label: "Status", value: <StatusBadge family="reconciliation" status={record.status} /> },
              { label: "Kind", value: record.kind.toLowerCase() },
              { label: "Expected amount", value: formatRwf(record.expectedAmountRwf) },
              { label: "Recorded amount", value: formatRwf(record.recordedAmountRwf) },
              { label: "Difference", value: difference === 0 ? "None" : `${difference > 0 ? "+" : "−"}${formatRwf(Math.abs(difference))}` },
              { label: "Date", value: formatDateTime(record.date) },
              { label: "Provider reference", value: <span className="font-mono text-sm">{record.providerRef}</span> },
              { label: "Booking", value: record.bookingId ?? "—" },
              { label: "Note", value: record.note ?? "—", wide: true },
            ]}
          />
          {record.status === "DUPLICATE" ? <Notice tone="warning" title="Possible duplicate">Check that the same amount was not recorded twice before dismissing this record.</Notice> : null}
        </div>
        <div>
          {!canAct ? (
            <p className="text-sm text-muted">Reviewing records is unavailable for your role.</p>
          ) : record.status === "MATCHED" ? (
            <Notice tone="success" title="Already reviewed or matched">This record needs no further action.</Notice>
          ) : (
            <NoteAction
              fieldLabel="Review note"
              placeholder="How was this record checked?"
              errorMessage="Explain how this record was reviewed (at least 5 characters)."
              label="Mark reviewed"
              title="Mark this record as reviewed?"
              message="The record moves to Matched and your review note is saved."
              disabled={busy}
              summary={(note) => [`Difference on record: ${difference === 0 ? "none" : formatRwf(Math.abs(difference))}`, `Note: ${note}`]}
              onConfirm={(note) => run(async () => { await services.admin.resolveReconciliation(actor, record.id, note); return true; }, { success: "Record marked reviewed." })}
            />
          )}
        </div>
      </div>
    </Section>
  );
}
