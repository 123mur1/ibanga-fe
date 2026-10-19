import { z } from "zod";

export const SUITABILITY_OPTIONS = [
  "General cargo",
  "Containers",
  "Building materials",
  "Machinery",
  "Agriculture",
  "Perishables",
  "Fuel and chemicals",
  "Retail goods",
] as const;

const dimension = (label: string) =>
  z.number({ error: `Enter the ${label}.` }).positive(`The ${label} must be above 0.`).max(60, `The ${label} looks too large. Check the value.`);

export const truckProfileSchema = z.object({
  lengthM: dimension("length in metres"),
  widthM: dimension("width in metres"),
  heightM: dimension("height in metres"),
  volumeM3: z.number({ error: "Enter the load volume." }).positive("The volume must be above 0.").max(500, "The volume looks too large. Check the value."),
  suitability: z.array(z.string()),
});

export type TruckProfileFormValues = z.input<typeof truckProfileSchema>;

export const TRUCK_DOCUMENT_TYPES = [
  { value: "VEHICLE_REGISTRATION", label: "Vehicle registration" },
  { value: "VEHICLE_INSPECTION", label: "Technical inspection" },
  { value: "INSURANCE_POLICY", label: "Insurance policy" },
] as const;

export const truckDocumentSchema = z
  .object({
    type: z.enum(["VEHICLE_REGISTRATION", "VEHICLE_INSPECTION", "INSURANCE_POLICY"]),
    issueDate: z.string(),
    expiryDate: z.string().min(1, "Enter the expiry date shown on the document."),
  })
  .refine((value) => !value.issueDate || !value.expiryDate || value.expiryDate >= value.issueDate, {
    path: ["expiryDate"],
    message: "Expiry cannot be before the issue date.",
  });

export type TruckDocumentFormValues = z.input<typeof truckDocumentSchema>;
