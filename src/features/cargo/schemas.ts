import { z } from "zod";
import type { CargoRequestInput } from "@/services/contracts";
import { TRUCK_TYPES } from "@/lib/types";
import type { PickedFile } from "@/lib/forms";
import type { CargoRequest } from "@/types/ops";

export const CATEGORY_VALUES = ["GENERAL", "BUILDING_MATERIALS", "PERISHABLES", "MACHINERY", "FUEL_CHEMICALS", "AGRICULTURE", "RETAIL_GOODS", "OTHER"] as const;

const pickedFile = z.object({ name: z.string(), url: z.string(), mimeType: z.string(), sizeBytes: z.number() });

/** A number typed into a text box: required, and above zero (and below a sensible ceiling). */
const positive = (label: string, max: number, unit: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label}.`)
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, `${label[0].toUpperCase()}${label.slice(1)} must be above 0.`)
    .refine((value) => Number(value) <= max, `That looks too large (maximum ${max} ${unit}).`)
    .transform(Number);

const phone = z
  .string()
  .trim()
  .min(1, "Enter a phone number.")
  .regex(/^\+?[0-9 ()-]{7,18}$/, "Enter a valid phone number, for example +250 788 123 456.");

const required = (message: string, min = 1) => z.string().trim().min(min, message);

/** Full schema used to publish a request (and to save changes to an open one). */
export const cargoRequestSchema = z
  .object({
    title: required("Enter a short title for the cargo.", 3),
    description: required("Describe the cargo in at least 10 characters.", 10),
    category: z.enum(CATEGORY_VALUES),
    pickupLocation: required("Choose the pickup location."),
    pickupAddress: required("Enter the pickup address."),
    pickupDate: required("Choose the pickup date."),
    pickupContactName: required("Enter the pickup contact name.", 2),
    pickupContactPhone: phone,
    deliveryLocation: required("Choose the destination."),
    deliveryAddress: required("Enter the delivery address."),
    deliveryDate: required("Choose the delivery date."),
    deliveryContactName: required("Enter the destination contact name.", 2),
    deliveryContactPhone: phone,
    weightTons: positive("the cargo weight", 100, "tons"),
    volumeM3: positive("the cargo volume", 200, "m³"),
    lengthM: positive("the length", 30, "m"),
    widthM: positive("the width", 5, "m"),
    heightM: positive("the height", 6, "m"),
    truckType: z.enum(TRUCK_TYPES, { error: "Choose the truck type you need." }),
    minCapacityTons: positive("the minimum truck capacity", 100, "tons"),
    valueRwf: positive("the estimated cargo value", 100_000_000_000, "RWF"),
    budgetRwf: z
      .string()
      .trim()
      .refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) > 0), "The budget must be above 0, or leave it empty.")
      .transform((value) => (value === "" ? undefined : Number(value))),
    fragile: z.boolean(),
    hazardous: z.boolean(),
    perishable: z.boolean(),
    specialHandling: z.boolean(),
    loadingRequirements: z.string().trim(),
    unloadingRequirements: z.string().trim(),
    instructions: z.string().trim(),
    photos: z.array(pickedFile),
    documents: z.array(pickedFile),
  })
  .superRefine((value, context) => {
    if (value.pickupDate && value.deliveryDate && value.deliveryDate < value.pickupDate) {
      context.addIssue({ code: "custom", path: ["deliveryDate"], message: "Delivery cannot be before pickup." });
    }
    if (value.pickupLocation && value.pickupLocation === value.deliveryLocation) {
      context.addIssue({ code: "custom", path: ["deliveryLocation"], message: "Pickup and destination must be different." });
    }
    if (value.minCapacityTons < value.weightTons) {
      context.addIssue({ code: "custom", path: ["minCapacityTons"], message: "Minimum capacity must be at least the cargo weight." });
    }
  });

/** A draft only needs a title. */
export const cargoDraftSchema = z.object({ title: required("Enter a short title for the cargo.", 3) });

export type CargoFormInput = z.input<typeof cargoRequestSchema>;
export type CargoFormOutput = z.output<typeof cargoRequestSchema>;

export const EMPTY_CARGO_FORM: CargoFormInput = {
  title: "",
  description: "",
  category: "GENERAL",
  pickupLocation: "",
  pickupAddress: "",
  pickupDate: "",
  pickupContactName: "",
  pickupContactPhone: "",
  deliveryLocation: "",
  deliveryAddress: "",
  deliveryDate: "",
  deliveryContactName: "",
  deliveryContactPhone: "",
  weightTons: "",
  volumeM3: "",
  lengthM: "",
  widthM: "",
  heightM: "",
  truckType: "" as CargoFormInput["truckType"],
  minCapacityTons: "",
  valueRwf: "",
  budgetRwf: "",
  fragile: false,
  hazardous: false,
  perishable: false,
  specialHandling: false,
  loadingRequirements: "",
  unloadingRequirements: "",
  instructions: "",
  photos: [],
  documents: [],
};

const text = (value: number | undefined) => (value ? String(value) : "");

/** Fills the form from a saved request (edit page). Stored photos come back as image files. */
export function requestToForm(request: CargoRequest): CargoFormInput {
  return {
    title: request.title,
    description: request.description,
    category: request.category,
    pickupLocation: request.pickup.location,
    pickupAddress: request.pickup.address,
    pickupDate: request.pickup.date,
    pickupContactName: request.pickup.contactName,
    pickupContactPhone: request.pickup.contactPhone,
    deliveryLocation: request.delivery.location,
    deliveryAddress: request.delivery.address,
    deliveryDate: request.delivery.date,
    deliveryContactName: request.delivery.contactName,
    deliveryContactPhone: request.delivery.contactPhone,
    weightTons: text(request.weightTons),
    volumeM3: text(request.volumeM3),
    lengthM: text(request.lengthM),
    widthM: text(request.widthM),
    heightM: text(request.heightM),
    truckType: request.truckType as CargoFormInput["truckType"],
    minCapacityTons: text(request.minCapacityTons),
    valueRwf: text(request.valueRwf),
    budgetRwf: text(request.budgetRwf),
    fragile: request.flags.includes("FRAGILE"),
    hazardous: request.flags.includes("HAZARDOUS"),
    perishable: request.flags.includes("PERISHABLE"),
    specialHandling: request.flags.includes("SPECIAL_HANDLING"),
    loadingRequirements: request.loadingRequirements,
    unloadingRequirements: request.unloadingRequirements,
    instructions: request.instructions,
    photos: request.photos.map((url, index): PickedFile => ({ name: `Cargo photo ${index + 1}`, url, mimeType: "image/jpeg", sizeBytes: 0 })),
    documents: request.documentNames.map((name): PickedFile => ({ name, url: "", mimeType: "application/pdf", sizeBytes: 0 })),
  };
}

type Loose = Partial<CargoFormInput>;

const num = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

/** Service input from validated form output (publish). */
export function outputToInput(values: CargoFormOutput): CargoRequestInput {
  return {
    title: values.title,
    description: values.description,
    category: values.category,
    pickup: { location: values.pickupLocation, address: values.pickupAddress, contactName: values.pickupContactName, contactPhone: values.pickupContactPhone, date: values.pickupDate },
    delivery: { location: values.deliveryLocation, address: values.deliveryAddress, contactName: values.deliveryContactName, contactPhone: values.deliveryContactPhone, date: values.deliveryDate },
    weightTons: values.weightTons,
    volumeM3: values.volumeM3,
    lengthM: values.lengthM,
    widthM: values.widthM,
    heightM: values.heightM,
    truckType: values.truckType,
    minCapacityTons: values.minCapacityTons,
    valueRwf: values.valueRwf,
    budgetRwf: values.budgetRwf,
    flags: [
      ...(values.fragile ? (["FRAGILE"] as const) : []),
      ...(values.hazardous ? (["HAZARDOUS"] as const) : []),
      ...(values.perishable ? (["PERISHABLE"] as const) : []),
      ...(values.specialHandling ? (["SPECIAL_HANDLING"] as const) : []),
    ],
    loadingRequirements: values.loadingRequirements,
    unloadingRequirements: values.unloadingRequirements,
    instructions: values.instructions,
    photos: values.photos.map((file) => file.url),
    documentNames: values.documents.map((file) => file.name),
  };
}

/** Service input from whatever is typed so far (draft). Unfilled numbers become 0, never NaN. */
export function looseToInput(values: Loose): CargoRequestInput {
  const base = { ...EMPTY_CARGO_FORM, ...values };
  return {
    ...outputToInput({
      ...base,
      weightTons: num(base.weightTons),
      volumeM3: num(base.volumeM3),
      lengthM: num(base.lengthM),
      widthM: num(base.widthM),
      heightM: num(base.heightM),
      minCapacityTons: num(base.minCapacityTons),
      valueRwf: num(base.valueRwf),
      budgetRwf: num(base.budgetRwf) || undefined,
    } as CargoFormOutput),
  };
}

/** The service reports contact problems under one key; the form has name and phone fields. */
export const SERVICE_FIELD_MAP: Record<string, string> = {
  pickupContact: "pickupContactName",
  deliveryContact: "deliveryContactName",
};

export const CANCEL_REQUEST_MIN_REASON = 3;
