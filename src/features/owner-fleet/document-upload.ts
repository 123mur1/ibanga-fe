import { services } from "@/services";
import type { DocumentInput } from "@/services/contracts";
import type { Actor } from "@/services/types";
import type { OpsDocument } from "@/types/ops";

/**
 * Upload a document, or resubmit the existing one of the same type for the same subject
 * (a second upload would leave two competing documents and confuse eligibility checks).
 * A document that is already waiting for review cannot be replaced.
 */
export async function uploadOrResubmit(actor: Actor, input: DocumentInput, existing: OpsDocument[]): Promise<OpsDocument> {
  const current = existing.find((doc) => doc.type === input.type && doc.subjectKind === input.subjectKind && doc.subjectId === input.subjectId);
  if (!current) return services.documents.upload(actor, input);
  return services.documents.resubmit(actor, current.id, {
    fileName: input.fileName,
    fileUrl: input.fileUrl,
    mimeType: input.mimeType,
    issueDate: input.issueDate,
    expiryDate: input.expiryDate,
  });
}
