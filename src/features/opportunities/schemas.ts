import { z } from "zod";

/** Quotation form. Server rules (capacity, eligibility, duplicates) are enforced again by the service. */
export const quotationSchema = z
  .object({
    truckId: z.string().min(1, "Choose the truck for this job."),
    driverId: z.string().optional(),
    amountRwf: z
      .number({ error: "Enter your price in RWF." })
      .int("Enter a whole number of francs.")
      .min(1000, "Enter a price of at least RWF 1,000.")
      .max(500_000_000, "That price looks too high. Check the amount."),
    estimatedPickupDate: z.string().min(1, "Choose the pickup date."),
    estimatedDeliveryDate: z.string().min(1, "Choose the delivery date."),
    notes: z.string().trim().max(600, "Keep notes under 600 characters."),
  })
  .refine((value) => !value.estimatedPickupDate || !value.estimatedDeliveryDate || value.estimatedDeliveryDate >= value.estimatedPickupDate, {
    path: ["estimatedDeliveryDate"],
    message: "Delivery cannot be before pickup.",
  });

export type QuotationFormValues = z.input<typeof quotationSchema>;
