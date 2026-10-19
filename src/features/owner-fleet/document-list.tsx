import { StatusBadge } from "@/components/common/status-badge";
import { effectiveDocumentStatus, expiryState, daysUntil } from "@/config/business-rules";
import { formatDate, titleCase } from "@/lib/format";
import type { OpsDocument } from "@/types/ops";

/** Documents with verification status and expiry state. Expired documents block work, so they are loud. */
export function DocumentList({ documents, empty = "No documents uploaded yet." }: { documents: OpsDocument[]; empty?: string }) {
  if (!documents.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line rounded-xl border border-line">
      {documents.map((doc) => {
        const state = expiryState(doc.expiryDate);
        const days = doc.expiryDate ? daysUntil(doc.expiryDate) : undefined;
        return (
          <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="font-semibold text-navy">{doc.title}</p>
              <p className="text-xs text-muted">
                {titleCase(doc.type)} · {doc.ref} · {doc.fileName}
                {doc.version > 1 ? ` · version ${doc.version}` : ""}
              </p>
              {doc.expiryDate ? (
                <p className={`mt-0.5 text-xs ${state === "EXPIRED" ? "font-semibold text-bad" : state === "EXPIRING" ? "font-semibold text-warn" : "text-muted"}`}>
                  {state === "EXPIRED" ? `Expired on ${formatDate(doc.expiryDate)}` : `Expires ${formatDate(doc.expiryDate)}${days !== undefined ? ` (${days} day${days === 1 ? "" : "s"} left)` : ""}`}
                </p>
              ) : null}
              {doc.status === "REJECTED" && doc.rejectionReason ? <p className="mt-0.5 text-xs text-bad">Rejected: {doc.rejectionReason}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge family="verification" status={effectiveDocumentStatus(doc)} />
              {state === "EXPIRING" || state === "EXPIRED" ? <StatusBadge family="documentExpiry" status={state} /> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
