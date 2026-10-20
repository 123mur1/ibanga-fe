import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().trim().min(4, "Enter a title of at least 4 characters.").max(100, "Keep the title under 100 characters."),
  body: z.string().trim().min(10, "Write at least 10 characters.").max(1000, "Keep the text under 1000 characters."),
  audience: z.enum(["ALL", "IMPORTER", "TRUCK_OWNER", "DRIVER", "ADMIN"]),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
  expiresOn: z
    .string()
    .refine((value) => !value || value >= new Date().toISOString().slice(0, 10), "The expiry date cannot be in the past."),
});

const wholeNumber = (label: string, min: number, max: number) =>
  z.number({ error: `Enter a number for ${label}.` }).int("Use a whole number.").min(min, `Minimum is ${min}.`).max(max, `Maximum is ${max}.`);

export const settingsSchema = z.object({
  platformFeePct: z.number({ error: "Enter a percentage." }).min(0, "Minimum is 0.").max(30, "Maximum is 30."),
  quotationValidityDays: wholeNumber("quotation validity", 1, 30),
  documentWarningDays: wholeNumber("document warning", 1, 180),
  cancellationFreeWindowHours: wholeNumber("the cancellation window", 0, 168),
  maxQuotationsPerRequest: wholeNumber("quotations per request", 1, 50),
  maintenanceBanner: z.string().trim().max(200, "Keep the banner under 200 characters."),
});
