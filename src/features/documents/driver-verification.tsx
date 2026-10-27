"use client";

import { Section } from "@/components/common/layout-blocks";
import { StatusBadge } from "@/components/common/status-badge";
import { effectiveDocumentStatus } from "@/config/business-rules";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import type { OpsDocument } from "@/types/ops";
import { UploadForm } from "./upload-form";

export function DriverVerification() {
  const actor = useActor();
  const { drivers, documents } = useOps();
  const driver = drivers.find((item) => item.userId === actor?.id);
  const ownDocuments = documents.filter(
    (document) =>
      document.subjectKind === "DRIVER" && document.subjectId === driver?.id,
  );
  const licence = ownDocuments.find((document) => document.type === "DRIVER_LICENCE");
  const state = licence
    ? effectiveDocumentStatus(licence)
    : driver?.verification ?? "NOT_SUBMITTED";

  return (
    <Section
      title="Driver verification"
      description="Upload your own driving licence. An administrator reviews it before you can be assigned to deliveries."
    >
      {!driver ? (
        <p className="text-sm text-muted">Your driver profile is not linked to this account yet. Contact your truck owner.</p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-background/60 p-4">
            <div>
              <p className="text-sm font-semibold text-navy">Driving licence status</p>
              <p className="mt-1 text-sm text-muted">
                {licence?.rejectionReason ?? (licence ? `${licence.title} · ${licence.fileName}` : "No driving licence has been submitted yet.")}
              </p>
            </div>
            <StatusBadge family="verification" status={state} />
          </div>
          {ownDocuments.length > 0 ? (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {ownDocuments.map((document: OpsDocument) => (
                <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                  <span className="text-navy">{document.title} <span className="text-muted">({document.type.replaceAll("_", " ")})</span></span>
                  <StatusBadge family="verification" status={document.status} />
                </li>
              ))}
            </ul>
          ) : null}
          <UploadForm subjects={[{ value: `DRIVER:${driver.id}`, label: "My driver profile" }]} />
        </div>
      )}
    </Section>
  );
}
