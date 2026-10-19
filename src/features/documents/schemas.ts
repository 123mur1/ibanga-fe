import { z } from "zod";
import type { DocumentSubjectKind, DocumentType } from "@/types/ops";

export const DOCUMENT_TYPES = [
  "IDENTITY",
  "COMPANY_REGISTRATION",
  "VEHICLE_REGISTRATION",
  "VEHICLE_INSPECTION",
  "INSURANCE_POLICY",
  "DRIVER_LICENCE",
  "PERMIT",
  "OTHER",
] as const;

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  IDENTITY: "Identity document",
  COMPANY_REGISTRATION: "Company registration",
  VEHICLE_REGISTRATION: "Vehicle registration",
  VEHICLE_INSPECTION: "Vehicle inspection",
  INSURANCE_POLICY: "Insurance policy",
  DRIVER_LICENCE: "Driving licence",
  PERMIT: "Permit",
  OTHER: "Other",
};

/** Document types that make sense for each kind of subject. */
export function typesFor(kind: DocumentSubjectKind): DocumentType[] {
  if (kind === "TRUCK") return ["VEHICLE_REGISTRATION", "VEHICLE_INSPECTION", "INSURANCE_POLICY", "PERMIT", "OTHER"];
  if (kind === "DRIVER") return ["DRIVER_LICENCE", "IDENTITY", "OTHER"];
  return ["IDENTITY", "COMPANY_REGISTRATION", "PERMIT", "OTHER"];
}

/** Subject select values look like "TRUCK:truck_1". */
export function parseSubject(value: string): { kind: DocumentSubjectKind; id: string } {
  const [kind, ...rest] = value.split(":");
  return { kind: kind as DocumentSubjectKind, id: rest.join(":") };
}

const optionalDate = z.string().optional();
const expiryAfterIssue = (value: { issueDate?: string; expiryDate?: string }) =>
  !value.issueDate || !value.expiryDate || value.expiryDate >= value.issueDate;
const expiryMessage = { path: ["expiryDate"], message: "Expiry cannot be before the issue date." };

export const documentSchema = z
  .object({
    subject: z.string().min(1, "Choose what this document is for."),
    type: z.enum(DOCUMENT_TYPES),
    title: z.string().trim().min(2, "Give the document a title."),
    issueDate: optionalDate,
    expiryDate: optionalDate,
  })
  .refine(expiryAfterIssue, expiryMessage);

export const renewSchema = z.object({ issueDate: optionalDate, expiryDate: optionalDate }).refine(expiryAfterIssue, expiryMessage);

export const policySchema = z
  .object({
    truckId: z.string().min(1, "Choose the insured truck."),
    provider: z.string().trim().min(2, "Enter the insurance provider."),
    policyNumber: z.string().trim().min(3, "Enter the policy number."),
    coverageRwf: z.string().trim().regex(/^\d+$/, "Enter the coverage as a whole number of RWF.").refine((value) => Number(value) > 0, "Coverage must be more than zero."),
    coverageNotes: z.string().trim().optional(),
    issueDate: z.string().min(1, "Enter the issue date."),
    expiryDate: z.string().min(1, "Enter the expiry date."),
  })
  .refine((value) => !value.issueDate || !value.expiryDate || value.expiryDate > value.issueDate, expiryMessage);
