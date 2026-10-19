"use client";

import { useState } from "react";
import { QueryBoundary } from "@/components/common/async-state";
import { controlClass } from "@/components/common/form-fields";
import { Section } from "@/components/common/layout-blocks";
import { RoleShell } from "@/components/common/role-shell";
import { SimulationNotice } from "@/components/common/notices";
import { statusOptions } from "@/components/common/status-badge";
import { effectiveDocumentStatus, expiryState } from "@/config/business-rules";
import { PageHeader, StatCard } from "@/components/ui";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { OpsDocument } from "@/types/ops";
import { DocumentRow } from "./document-row";
import { EligibilityPanel } from "./eligibility-panel";
import { PolicyManager } from "./policy-manager";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPES } from "./schemas";
import { UploadForm, type SubjectOption } from "./upload-form";

type Group = { key: string; title: string; hint?: string; docs: OpsDocument[]; alwaysShow: boolean };

export function DocumentCenter({ role }: { role: "IMPORTER" | "TRUCK_OWNER" }) {
  const owner = role === "TRUCK_OWNER";
  const actor = useActor();
  const { currentUser, trucks } = useIbanga();
  const { drivers, settings } = useOps();
  const query = useServiceQuery(() => services.documents.list(actor!, { pageSize: 200 }), [actor?.id]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [expiry, setExpiry] = useState("");

  const myTrucks = trucks.filter((truck) => truck.ownerId === currentUser?.id);
  const myDrivers = drivers.filter((driver) => driver.ownerId === currentUser?.id);
  const subjects: SubjectOption[] = currentUser
    ? [
        { value: `USER:${currentUser.id}`, label: "My account" },
        ...(owner ? myTrucks.map((truck) => ({ value: `TRUCK:${truck.id}`, label: `Truck ${truck.plateNumber}` })) : []),
        ...(owner ? myDrivers.map((driver) => ({ value: `DRIVER:${driver.id}`, label: `Driver ${driver.name}` })) : []),
      ]
    : [];

  function matches(doc: OpsDocument) {
    const needle = search.trim().toLowerCase();
    if (needle && !`${doc.title} ${doc.ref} ${doc.fileName} ${DOCUMENT_TYPE_LABELS[doc.type]}`.toLowerCase().includes(needle)) return false;
    if (type && doc.type !== type) return false;
    if (status && effectiveDocumentStatus(doc) !== status) return false;
    if (expiry && expiryState(doc.expiryDate, settings.documentWarningDays) !== expiry) return false;
    return true;
  }
  const filtering = Boolean(search || type || status || expiry);

  function groupsFor(all: OpsDocument[]): Group[] {
    const shown = all.filter(matches);
    if (!owner) return [{ key: "all", title: "Your documents", docs: shown, alwaysShow: true }];
    const of = (kind: string, id: string) => shown.filter((doc) => doc.subjectKind === kind && doc.subjectId === id);
    return [
      { key: "user", title: "My account", hint: "Identity and company documents", docs: of("USER", currentUser?.id ?? ""), alwaysShow: true },
      ...myTrucks.map((truck) => ({ key: truck.id, title: `Truck ${truck.plateNumber}`, hint: "Registration, inspection and insurance", docs: of("TRUCK", truck.id), alwaysShow: true })),
      ...myDrivers.map((driver) => ({ key: driver.id, title: `Driver ${driver.name}`, hint: "Driving licence", docs: of("DRIVER", driver.id), alwaysShow: true })),
    ];
  }

  return (
    <RoleShell role={role}>
      <PageHeader
        eyebrow={owner ? "Compliance" : "Account"}
        title={owner ? "Insurance & documents" : "Documents"}
        subtitle={owner ? "Keep trucks, drivers and your account compliant. Expired or unapproved documents stop work." : "Upload the documents needed to verify your identity and company."}
      />
      <div className="mt-5"><SimulationNotice kind="verification" /></div>
      <QueryBoundary query={query}>
        {(page) => {
          const docs = page.items;
          const count = (wanted: string) => docs.filter((doc) => effectiveDocumentStatus(doc) === wanted).length;
          const attention = docs.filter((doc) => effectiveDocumentStatus(doc) === "REJECTED" || ["EXPIRING", "EXPIRED"].includes(expiryState(doc.expiryDate, settings.documentWarningDays))).length;
          const groups = groupsFor(docs);
          const visible = groups.filter((group) => group.docs.length || (!filtering && group.alwaysShow && owner));
          return (
            <div className="space-y-6">
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Documents" value={docs.length} hint="Uploaded" />
                <StatCard label="Approved" value={count("APPROVED")} hint="Counted as valid" accent="good" />
                <StatCard label="In review" value={count("PENDING")} hint="Awaiting an administrator" accent="warn" />
                <StatCard label="Need attention" value={attention} hint={`Rejected, expired or expiring within ${settings.documentWarningDays} days`} accent={attention ? "bad" : "good"} />
              </div>

              {owner ? <EligibilityPanel documents={docs} /> : null}

              <UploadForm subjects={subjects} />

              <Section title="Your documents" padded={false}>
                <div className="grid gap-3 border-b border-line px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
                  <input className={controlClass} type="search" aria-label="Search documents" placeholder="Search title, reference or file" value={search} onChange={(event) => setSearch(event.target.value)} />
                  <select className={controlClass} aria-label="Filter by type" value={type} onChange={(event) => setType(event.target.value)}>
                    <option value="">All types</option>
                    {DOCUMENT_TYPES.map((key) => <option key={key} value={key}>{DOCUMENT_TYPE_LABELS[key]}</option>)}
                  </select>
                  <select className={controlClass} aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">All statuses</option>
                    {statusOptions("verification").filter((option) => option.value !== "NOT_SUBMITTED").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <select className={controlClass} aria-label="Filter by expiry" value={expiry} onChange={(event) => setExpiry(event.target.value)}>
                    <option value="">Any expiry</option>
                    <option value="EXPIRING">Expiring soon</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
                {docs.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-muted">No documents yet. Upload your first document above.</p>
                ) : visible.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-muted">No documents match these filters.</p>
                ) : (
                  visible.map((group) => (
                    <div key={group.key} className="border-b border-line last:border-b-0">
                      {owner ? (
                        <div className="bg-background/60 px-5 py-2.5">
                          <h3 className="text-sm font-semibold text-navy">{group.title}</h3>
                          {group.hint ? <p className="text-xs text-muted">{group.hint}</p> : null}
                        </div>
                      ) : null}
                      {group.docs.length ? (
                        <ul className="divide-y divide-line">
                          {group.docs.map((doc) => <DocumentRow key={doc.id} doc={doc} warningDays={settings.documentWarningDays} />)}
                        </ul>
                      ) : (
                        <p className="px-5 py-4 text-sm text-muted">No documents uploaded for this yet.</p>
                      )}
                    </div>
                  ))
                )}
              </Section>

              {owner ? <PolicyManager /> : null}
            </div>
          );
        }}
      </QueryBoundary>
    </RoleShell>
  );
}
