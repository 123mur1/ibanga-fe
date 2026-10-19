/** Demonstration documents, verification requests and insurance policies. SAMPLE DATA. */
import type {
  DocumentSubjectKind,
  DocumentType,
  InsurancePolicy,
  OpsDocument,
  VerificationKind,
  VerificationRequest,
  VerificationStatus,
} from "@/types/ops";
import { at, day, ref, sampleFile } from "./helpers";

let serial = 0;

type DocInput = {
  type: DocumentType;
  subjectKind: DocumentSubjectKind;
  subjectId: string;
  ownerId: string;
  title: string;
  status?: VerificationStatus;
  issued?: number;
  expires?: number | null;
  rejection?: string;
  submitted?: number;
  version?: number;
};

function doc(input: DocInput): OpsDocument {
  serial += 1;
  const status = input.status ?? "APPROVED";
  const submitted = input.submitted ?? -30;
  return {
    id: `doc${serial}`,
    ref: ref("DOC", serial),
    type: input.type,
    subjectKind: input.subjectKind,
    subjectId: input.subjectId,
    ownerId: input.ownerId,
    title: input.title,
    fileName: `${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.svg`,
    fileUrl: sampleFile(input.title),
    mimeType: "image/svg+xml",
    issueDate: day(input.issued ?? -200),
    expiryDate: input.expires === null ? undefined : day(input.expires ?? 365),
    status,
    rejectionReason: input.rejection,
    submittedAt: at(submitted),
    reviewedAt: status === "PENDING" || status === "NOT_SUBMITTED" ? undefined : at(submitted + 1, 14),
    reviewedBy: status === "PENDING" || status === "NOT_SUBMITTED" ? undefined : "u-admin-ops",
    version: input.version ?? 1,
  };
}

const identity = (userId: string, name: string, status: VerificationStatus = "APPROVED", extra: Partial<DocInput> = {}) =>
  doc({ type: "IDENTITY", subjectKind: "USER", subjectId: userId, ownerId: userId, title: `National ID - ${name}`, expires: 1500, status, ...extra });
const company = (userId: string, name: string, status: VerificationStatus = "APPROVED", extra: Partial<DocInput> = {}) =>
  doc({ type: "COMPANY_REGISTRATION", subjectKind: "USER", subjectId: userId, ownerId: userId, title: `Company registration - ${name}`, expires: null, status, ...extra });

const truckDocs = (truckId: string, ownerId: string, plate: string, over: { inspection?: Partial<DocInput>; registration?: Partial<DocInput>; insurance?: Partial<DocInput> } = {}) => [
  doc({ type: "VEHICLE_REGISTRATION", subjectKind: "TRUCK", subjectId: truckId, ownerId, title: `Vehicle registration ${plate}`, expires: 400, ...over.registration }),
  doc({ type: "VEHICLE_INSPECTION", subjectKind: "TRUCK", subjectId: truckId, ownerId, title: `Inspection certificate ${plate}`, expires: 120, ...over.inspection }),
  doc({ type: "INSURANCE_POLICY", subjectKind: "TRUCK", subjectId: truckId, ownerId, title: `Insurance policy ${plate}`, expires: 200, ...over.insurance }),
];

const licence = (driverId: string, ownerId: string, name: string, expires: number, status: VerificationStatus = "APPROVED") =>
  doc({ type: "DRIVER_LICENCE", subjectKind: "DRIVER", subjectId: driverId, ownerId, title: `Driving licence - ${name}`, expires, status });

export const documents: OpsDocument[] = [
  identity("u-importer", "Jeanine Uwase"),
  company("u-importer", "Uwase Import Co."),
  identity("u-importer-2", "David Okello"),
  company("u-importer-2", "Okello Cargo", "PENDING", { submitted: -2 }),
  identity("u-importer-3", "Maya Niyonzima", "PENDING", { submitted: -1 }),
  identity("u-owner", "Eric Ndayisaba"),
  company("u-owner", "Ndayi Transport"),
  identity("u-owner-2", "Amina Hassan"),
  company("u-owner-2", "Coastal Haul", "REJECTED", { rejection: "The registration certificate is cropped. Upload the full page including the registrar's stamp.", submitted: -9 }),

  ...truckDocs("t1", "u-owner", "RAD 418C"),
  ...truckDocs("t4", "u-owner", "RAD 731K", { inspection: { expires: 20 }, insurance: { expires: 25 } }),
  ...truckDocs("t6", "u-owner", "RAD 092T", { inspection: { expires: -10 } }),
  ...truckDocs("truck-u-owner-1", "u-owner", "RAD 310A"),
  ...truckDocs("truck-u-owner-3", "u-owner", "RAD 334C"),
  ...truckDocs("truck-u-owner-4", "u-owner", "RAD 346D"),
  ...truckDocs("t2", "u-owner-2", "KDA 620M"),
  ...truckDocs("t3", "u-owner-2", "KDM 204B"),
  ...truckDocs("t5", "u-owner-2", "KDA 885R", {
    registration: { status: "PENDING", submitted: -3 },
    inspection: { status: "REJECTED", rejection: "The inspection photo is unreadable. Resubmit a clear scan of both pages.", submitted: -5 },
  }),

  licence("d1", "u-owner", "Jean Claude Habimana", 300),
  licence("d2", "u-owner", "Olivier Nsengiyumva", 90),
  licence("d3", "u-owner", "Théogène Mugabo", 12),
  licence("d4", "u-owner", "Innocent Bizimana", -20, "EXPIRED"),
  licence("d5", "u-owner-2", "Hassan Mwinyi", 250),
  licence("d6", "u-owner-2", "Salim Juma", 400),
  licence("d7", "u-owner-2", "Peter Otieno", 520, "PENDING"),
];

const byId = (id: string) => documents.find((item) => item.id === id);
const findDoc = (type: DocumentType, subjectId: string) =>
  documents.find((item) => item.type === type && item.subjectId === subjectId);

function request(
  index: number,
  kind: VerificationKind,
  subjectKind: DocumentSubjectKind,
  subjectId: string,
  requesterId: string,
  docs: (string | undefined)[],
  status: VerificationStatus,
  extra: Partial<VerificationRequest> = {},
): VerificationRequest {
  const ids = docs.filter((item): item is string => Boolean(item));
  const submittedAt = ids.map((id) => byId(id)?.submittedAt).filter(Boolean).sort().at(0) ?? at(-3);
  return {
    id: `vr${index}`,
    ref: ref("VER", index),
    kind,
    subjectKind,
    subjectId,
    requesterId,
    documentIds: ids,
    status,
    submittedAt,
    reviewedAt: status === "PENDING" ? undefined : at(-1, 11),
    reviewedBy: status === "PENDING" ? undefined : "u-admin-ops",
    ...extra,
  };
}

export const verificationRequests: VerificationRequest[] = [
  request(1, "COMPANY", "USER", "u-importer-2", "u-importer-2", [findDoc("COMPANY_REGISTRATION", "u-importer-2")?.id], "PENDING"),
  request(2, "IDENTITY", "USER", "u-importer-3", "u-importer-3", [findDoc("IDENTITY", "u-importer-3")?.id], "PENDING"),
  request(3, "VEHICLE", "TRUCK", "t5", "u-owner-2", [findDoc("VEHICLE_REGISTRATION", "t5")?.id], "PENDING"),
  request(4, "DRIVER", "DRIVER", "d7", "u-owner-2", [findDoc("DRIVER_LICENCE", "d7")?.id], "PENDING"),
  request(5, "COMPANY", "USER", "u-owner-2", "u-owner-2", [findDoc("COMPANY_REGISTRATION", "u-owner-2")?.id], "REJECTED", {
    rejectionReason: "The registration certificate is cropped. Upload the full page including the registrar's stamp.",
  }),
  request(6, "VEHICLE", "TRUCK", "t5", "u-owner-2", [findDoc("VEHICLE_INSPECTION", "t5")?.id], "REJECTED", {
    rejectionReason: "The inspection photo is unreadable. Resubmit a clear scan of both pages.",
  }),
  request(7, "IDENTITY", "USER", "u-owner", "u-owner", [findDoc("IDENTITY", "u-owner")?.id], "APPROVED"),
  request(8, "INSURANCE", "TRUCK", "t1", "u-owner", [findDoc("INSURANCE_POLICY", "t1")?.id], "APPROVED"),
];

export const insurancePolicies: InsurancePolicy[] = [
  { id: "pol10", ownerId: "u-owner", truckId: "truck-u-owner-5", provider: "SORAS Insurance", policyNumber: "SOR-MV-2026-004790", coverageRwf: 42_000_000, coverageNotes: "Comprehensive motor and goods-in-transit.", issueDate: day(-165), expiryDate: day(200) },
  { id: "pol8", ownerId: "u-owner", truckId: "truck-u-owner-3", provider: "Prime Insurance", policyNumber: "PRM-MV-2026-118901", coverageRwf: 38_000_000, coverageNotes: "Comprehensive motor and goods-in-transit.", issueDate: day(-165), expiryDate: day(200), documentId: findDoc("INSURANCE_POLICY", "truck-u-owner-3")?.id },
  { id: "pol9", ownerId: "u-owner", truckId: "truck-u-owner-4", provider: "Prime Insurance", policyNumber: "PRM-MV-2026-118944", coverageRwf: 30_000_000, coverageNotes: "Comprehensive motor and goods-in-transit.", issueDate: day(-165), expiryDate: day(200), documentId: findDoc("INSURANCE_POLICY", "truck-u-owner-4")?.id },
  { id: "pol1", ownerId: "u-owner", truckId: "t1", provider: "SORAS Insurance", policyNumber: "SOR-MV-2026-004118", coverageRwf: 60_000_000, coverageNotes: "Comprehensive motor and goods-in-transit up to RWF 60M per trip.", issueDate: day(-165), expiryDate: day(200), documentId: findDoc("INSURANCE_POLICY", "t1")?.id },
  { id: "pol2", ownerId: "u-owner", truckId: "t4", provider: "Sonarwa Allianz", policyNumber: "SNW-CM-2026-021903", coverageRwf: 35_000_000, coverageNotes: "Comprehensive motor with goods-in-transit rider.", issueDate: day(-340), expiryDate: day(25), documentId: findDoc("INSURANCE_POLICY", "t4")?.id },
  { id: "pol3", ownerId: "u-owner", truckId: "t6", provider: "SORAS Insurance", policyNumber: "SOR-MV-2026-004512", coverageRwf: 80_000_000, coverageNotes: "Hazardous liquids rider included.", issueDate: day(-215), expiryDate: day(150), documentId: findDoc("INSURANCE_POLICY", "t6")?.id },
  { id: "pol4", ownerId: "u-owner", truckId: "truck-u-owner-1", provider: "Prime Insurance", policyNumber: "PRM-MV-2026-118820", coverageRwf: 40_000_000, coverageNotes: "Comprehensive motor and goods-in-transit.", issueDate: day(-165), expiryDate: day(200), documentId: findDoc("INSURANCE_POLICY", "truck-u-owner-1")?.id },
  { id: "pol5", ownerId: "u-owner-2", truckId: "t2", provider: "Jubilee Insurance", policyNumber: "JUB-KE-2026-770214", coverageRwf: 55_000_000, coverageNotes: "Reefer breakdown cover included.", issueDate: day(-165), expiryDate: day(200), documentId: findDoc("INSURANCE_POLICY", "t2")?.id },
  { id: "pol6", ownerId: "u-owner-2", truckId: "t3", provider: "Jubilee Insurance", policyNumber: "JUB-KE-2026-770290", coverageRwf: 70_000_000, coverageNotes: "Heavy haulage and machinery cover.", issueDate: day(-165), expiryDate: day(200), documentId: findDoc("INSURANCE_POLICY", "t3")?.id },
  { id: "pol7", ownerId: "u-owner-2", truckId: "t5", provider: "Jubilee Insurance", policyNumber: "JUB-KE-2026-770311", coverageRwf: 45_000_000, coverageNotes: "Comprehensive motor.", issueDate: day(-165), expiryDate: day(200), documentId: findDoc("INSURANCE_POLICY", "t5")?.id },
];
