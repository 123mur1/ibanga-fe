import { z } from "zod";

/** A required free-text note or reason. Every rejection, hold, failure and review needs one. */
export const noteSchema = (message: string, min = 5) => z.string().trim().min(min, message).max(500, "Keep this under 500 characters.");

export const adjustmentSchema = z.object({
  direction: z.enum(["INCREASE", "DECREASE"]),
  amount: z
    .string()
    .trim()
    .regex(/^\d+$/, "Enter whole francs, digits only.")
    .refine((value) => Number(value) > 0 && Number(value) <= 500_000_000, "Enter an amount above zero."),
  note: noteSchema("Explain the adjustment (at least 5 characters)."),
});

export type AdjustmentValues = z.infer<typeof adjustmentSchema>;
