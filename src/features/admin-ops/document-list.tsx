"use client";

import { StatusBadge } from "@/components/common/status-badge";
import { daysUntil, effectiveDocumentStatus, expiryState } from "@/config/business-rules";
import { useOps } from "@/hooks/use-ops";
import { formatDate, titleCase } from "@/lib/format";
import type { OpsDocument } from "@/types/ops";

/** Expiry badge text such as "Expires in 12 days" or "Expired 3 days ago". */
export function ExpiryBadge({ expiryDate }: { expiryDate?: string }) {
  const { settings } = useOps();
  const state = expiryState(expiryDate, settings.documentWarningDays);
  if (state === "NO_EXPIRY" || !expiryDate) return <StatusBadge family="documentExpiry" status="NO_EXPIRY" />;
  const days = daysUntil(expiryDate);
  const label = state === "EXPIRED" ? `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago` : state === "EXPIRING" ? `Expires in ${days} day${days === 1 ? "" : "s"}` : "Valid";
  return <StatusBadge family="documentExpiry" status={state} label={label} />;
}

/** Submitted documents with a preview (image inline, other files as a link). */
export function DocumentList({ documents, highlightIds = [] }: { documents: OpsDocument[]; highlightIds?: string[] }) {
  if (!documents.length) return <p className="text-sm text-muted">No documents on file.</p>;
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {documents.map((doc) => {
        const isImage = doc.mimeType.startsWith("image/") || doc.fileUrl.startsWith("data:image/");
        return (
          <li key={doc.id} className={`overflow-hidden rounded-xl border bg-white ${highlightIds.includes(doc.id) ? "border-brand" : "border-line"}`}>
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={doc.fileUrl} alt={`Preview of ${doc.title}`} className="h-36 w-full bg-background object-contain" />
            ) : (
              <div className="flex h-36 items-center justify-center bg-brand-soft/50 text-sm font-semibold text-brand-dark">
                {doc.fileUrl ? "Preview not available here" : "No file attached"}
              </div>
            )}
            <div className="space-y-2 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-navy">{doc.title}</p>
                <StatusBadge family="verification" status={effectiveDocumentStatus(doc)} />
              </div>
              <p className="text-muted">
                {titleCase(doc.type)} · {doc.ref} · v{doc.version}
              </p>
              <p className="text-muted">
                Issued {formatDate(doc.issueDate)} · Expires {formatDate(doc.expiryDate)}
              </p>
              <ExpiryBadge expiryDate={doc.expiryDate} />
              {doc.rejectionReason ? <p className="text-bad">Rejected: {doc.rejectionReason}</p> : null}
              {doc.fileUrl ? (
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" download={doc.fileName} className="block font-semibold text-brand hover:text-brand-dark">
                  Open {doc.fileName}
                </a>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
